import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalysis extends Document {
    originalFilename: string;
    jobRole: string;
    parsedData: {
        rawText: string;
        metadata: {
            pageCount?: number;
            author?: string;
            producer?: string;
        };
        structure: any; // Using any for flexibility, but should match ResumeStructure
        confidenceScore: number;
    };
    evaluations: {
        ats: {
            verdict: 'PASS' | 'BORDERLINE' | 'REJECT';
            score: number;
            issues: string[];
            structuredErrors: any[]; // StructuredError[]
        };
        recruiter: {
            verdict: 'PASS' | 'BORDERLINE' | 'REJECT';
            comments: string[];
            structuredErrors: any[]; // StructuredError[]
        };
        engineer: {
            verdict: 'PASS' | 'BORDERLINE' | 'REJECT';
            summary: string;
            technicalCriticisms: string[];
            structuredErrors: any[]; // StructuredError[]
        };
    };
    correctionSuggestions?: any; // CorrectionProposal
    rejectionLetter: string;
    createdAt: Date;
}

const AnalysisSchema: Schema = new Schema({
    originalFilename: { type: String, required: true },
    jobRole: { type: String, default: 'Software Engineer' },
    parsedData: {
        rawText: { type: String, required: true },
        structure: { type: Schema.Types.Mixed },
        confidenceScore: { type: Number, required: true },
    },
    evaluations: {
        ats: {
            verdict: { type: String, enum: ['PASS', 'BORDERLINE', 'REJECT'] },
            score: Number,
            issues: [String],
            structuredErrors: [Schema.Types.Mixed],
        },
        recruiter: {
            verdict: { type: String, enum: ['PASS', 'BORDERLINE', 'REJECT'] },
            comments: [String],
            structuredErrors: [Schema.Types.Mixed],
        },
        engineer: {
            verdict: { type: String, enum: ['PASS', 'BORDERLINE', 'REJECT'] },
            summary: String,
            technicalCriticisms: [String],
            structuredErrors: [Schema.Types.Mixed],
        },
    },
    correctionSuggestions: Schema.Types.Mixed,
    rejectionLetter: String,
    createdAt: { type: Date, default: Date.now },
});

// Prevent recompilation of model
const Analysis: Model<IAnalysis> =
    mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

export default Analysis;
