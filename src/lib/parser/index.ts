import { parsePdf } from './pdfParser';
import { parseDocx } from './docxParser';
import { ParsedResume } from './types';

export async function parseResume(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
    if (mimeType === 'application/pdf') {
        return parsePdf(buffer);
    } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
    ) {
        return parseDocx(buffer);
    } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
}
