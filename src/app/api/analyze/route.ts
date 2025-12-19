import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '@/lib/parser';
import { evaluateAts } from '@/lib/evaluators/atsEvaluator';
import { evaluateRecruiter } from '@/lib/evaluators/recruiterEvaluator';
import { evaluateEngineer } from '@/lib/evaluators/engineerEvaluator';
import { generateRejectionLetter } from '@/lib/generator/rejectionGenerator';
import dbConnect from '@/lib/db/connect';
import Analysis from '@/lib/db/models/Analysis';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const jobRole = (formData.get('jobRole') as string) || 'Software Engineer';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;

        // 1. Parse
        const parsedResume = await parseResume(buffer, mimeType);

        // 2. Evaluate
        const atsResult = evaluateAts(parsedResume, jobRole);
        const recruiterResult = evaluateRecruiter(parsedResume);
        const engineerResult = evaluateEngineer(parsedResume);

        // 3. Generate Rejection
        const rejectionLetter = generateRejectionLetter(
            parsedResume.metadata.author || parsedResume.structure.contact.email?.split('@')[0],
            {
                ats: atsResult,
                recruiter: recruiterResult,
                engineer: engineerResult
            }
        );

        // 4. Save to DB
        await dbConnect();
        const analysis = await Analysis.create({
            originalFilename: file.name,
            jobRole,
            parsedData: parsedResume,
            evaluations: {
                ats: atsResult,
                recruiter: recruiterResult,
                engineer: engineerResult,
            },
            rejectionLetter,
        });

        return NextResponse.json({
            success: true,
            data: analysis
        });

    } catch (error: any) {
        console.error('Analysis Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
