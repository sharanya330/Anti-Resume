import mammoth from 'mammoth';
import { ParsedResume } from './types';
import { extractStructure } from './structureExtractor';

export async function parseDocx(buffer: Buffer): Promise<ParsedResume> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;

        if (result.messages.length > 0) {
            console.warn('DOCX Parsing Warnings:', result.messages);
        }

        if (text.trim().length < 50) {
            throw new Error('DOCX content too short or empty.');
        }

        const structure = extractStructure(text);

        let confidenceScore = 50;
        if (structure.experience.length > 0) confidenceScore += 15;
        if (structure.education.length > 0) confidenceScore += 15;
        if (structure.skills.length > 0) confidenceScore += 10;
        if (structure.contact.email) confidenceScore += 10;

        return {
            rawText: text,
            metadata: {}, // DOCX metadata extraction is limited with mammoth
            structure,
            confidenceScore: Math.min(confidenceScore, 100),
        };
    } catch (error: any) {
        console.error('DOCX Parsing Error:', error);
        throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
}
