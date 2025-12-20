import { ParsedResume } from './types';
import { extractStructure } from './structureExtractor';
// @ts-ignore
import PDFParser from 'pdf2json';

export async function parsePdf(buffer: Buffer): Promise<ParsedResume> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = text only

        pdfParser.on('pdfParser_dataError', (errData: any) => {
            console.error('PDF Parsing Error:', errData.parserError);
            reject(new Error(`Failed to parse PDF: ${errData.parserError}`));
        });

        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            try {
                // Extract text from pages
                // pdf2json returns URL-encoded text
                const rawText = pdfParser.getRawTextContent();

                if (!rawText || rawText.trim().length < 50) {
                    reject(new Error('PDF content too short or empty.'));
                    return;
                }

                const structure = extractStructure(rawText);

                // Calculate confidence score
                let confidenceScore = 50;
                if (structure.experience.length > 0) confidenceScore += 15;
                if (structure.education.length > 0) confidenceScore += 15;
                if (structure.skills.length > 0) confidenceScore += 10;
                if (structure.contact.email) confidenceScore += 10;

                // Extract metadata if available
                const metadata = {
                    pageCount: pdfData.Pages ? pdfData.Pages.length : 0,
                    author: pdfData.Meta ? pdfData.Meta.Author : undefined,
                    producer: pdfData.Meta ? pdfData.Meta.Producer : undefined,
                };

                resolve({
                    rawText,
                    metadata,
                    structure,
                    confidenceScore: Math.min(confidenceScore, 100),
                });
            } catch (err: any) {
                reject(new Error(`Failed to process PDF text: ${err.message}`));
            }
        });

        // Load the buffer
        pdfParser.parseBuffer(buffer);
    });
}
