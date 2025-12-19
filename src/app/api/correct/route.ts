import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Analysis from '@/lib/db/models/Analysis';
import { generateCorrections } from '@/lib/correction/correctionEngine';
import { StructuredError } from '@/lib/parser/types';

export async function POST(req: NextRequest) {
    try {
        const { analysisId } = await req.json();

        if (!analysisId) {
            return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
        }

        await dbConnect();
        const analysis = await Analysis.findById(analysisId);

        if (!analysis) {
            return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
        }

        // Aggregate all structured errors
        const allErrors: StructuredError[] = [
            ...(analysis.evaluations.ats.structuredErrors || []),
            ...(analysis.evaluations.recruiter.structuredErrors || []),
            ...(analysis.evaluations.engineer.structuredErrors || [])
        ];

        if (allErrors.length === 0) {
            return NextResponse.json({ error: 'No structured errors found to fix' }, { status: 400 });
        }

        // Generate corrections
        const correctionProposal = await generateCorrections(
            analysis.parsedData,
            allErrors,
            analysis.jobRole || 'Software Engineer'
        );

        // Save proposal to DB
        analysis.correctionSuggestions = correctionProposal;
        await analysis.save();

        return NextResponse.json({
            success: true,
            data: correctionProposal
        });

    } catch (error: any) {
        console.error('Correction Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
