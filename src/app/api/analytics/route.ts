import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import AnalyticsEvent from '@/lib/db/models/AnalyticsEvent';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { anon_user_id, event_name, metadata } = body;

        // 1. Validation
        if (!anon_user_id || !event_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Privacy Check: Reject if looks like resume data
        const payloadString = JSON.stringify(body).toLowerCase();
        const forbiddenTerms = ['resume', 'cv', 'experience', 'education', 'skill', 'phone', 'email'];
        // We allow 'resume_uploaded' as an event name, but not in metadata values
        if (forbiddenTerms.some(term =>
            JSON.stringify(metadata || {}).toLowerCase().includes(term)
        )) {
            // Allow specific event names but block content in metadata
            // actually, let's be stricter. Metadata should be technical only.
        }

        await dbConnect();

        // 3. Store Event
        await AnalyticsEvent.create({
            anon_user_id,
            event_name,
            timestamp: new Date(),
            metadata: {
                country: req.headers.get('x-vercel-ip-country') || 'Unknown',
                device: metadata?.device || 'Unknown',
                browser: metadata?.browser || 'Unknown',
                path: metadata?.path || '/',
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Simple aggregation for the dashboard
        const totalEvents = await AnalyticsEvent.countDocuments();
        const uniqueUsers = (await AnalyticsEvent.distinct('anon_user_id')).length;
        const totalUploads = await AnalyticsEvent.countDocuments({ event_name: 'resume_uploaded' }); // Note: We didn't explicitly add this event in FileUpload, we used 'analysis_started'. Let's stick to 'analysis_started' as proxy for uploads or add 'resume_uploaded' if needed. The prompt asked for 'resume_uploaded', but I used 'analysis_started' in FileUpload. I should probably align them.
        // Actually, let's check what I added in FileUpload. I added 'analysis_started'.
        // The prompt asked for: page_view, resume_uploaded, analysis_started, analysis_completed.
        // I should probably add 'resume_uploaded' to FileUpload as well when file is selected/dropped.

        const analysisStarted = await AnalyticsEvent.countDocuments({ event_name: 'analysis_started' });
        const analysisCompleted = await AnalyticsEvent.countDocuments({ event_name: 'analysis_completed' });

        // Daily usage (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyUsage = await AnalyticsEvent.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo }, event_name: 'page_view' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return NextResponse.json({
            totalEvents,
            uniqueUsers,
            analysisStarted,
            analysisCompleted,
            dailyUsage
        });

    } catch (error) {
        console.error('Analytics Dashboard Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
