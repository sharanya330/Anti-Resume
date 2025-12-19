import { ParsedResume } from './types';
import { extractStructure } from './structureExtractor';

// Use ESM import for pdfjs-dist as it now defaults to .mjs
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';

// Explicitly set worker source for Node.js environment to avoid "fake worker" errors
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

export async function parsePdf(buffer: Buffer): Promise<ParsedResume> {
    try {
        // Convert Buffer to Uint8Array as expected by pdfjs-dist
        const data = new Uint8Array(buffer);

        // Load the document
        const loadingTask = pdfjsLib.getDocument({
            data,
            // These options help avoid errors in Node.js environment
            useSystemFonts: true,
            disableFontFace: true,
            verbosity: 0 // Suppress warnings
        });

        const doc = await loadingTask.promise;
        const numPages = doc.numPages;
        let fullText = '';
        let info: any = {};

        // Extract metadata
        try {
            const meta = await doc.getMetadata();
            info = meta.info || {};
        } catch (e) {
            console.warn('Failed to extract metadata:', e);
        }

        // Extract text from all pages
        for (let i = 1; i <= numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();

            // Join items with space, but try to respect layout slightly
            // pdfjs returns items with 'str' and 'transform' (position)
            // For simple parsing, joining with space is usually enough
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        // Basic validation
        if (fullText.trim().length < 50) {
            throw new Error('PDF content too short or empty. Possible image-only PDF.');
        }

        const structure = extractStructure(fullText);

        // Calculate confidence score
        let confidenceScore = 50;
        if (structure.experience.length > 0) confidenceScore += 15;
        if (structure.education.length > 0) confidenceScore += 15;
        if (structure.skills.length > 0) confidenceScore += 10;
        if (structure.contact.email) confidenceScore += 10;

        return {
            rawText: fullText,
            metadata: {
                pageCount: numPages,
                author: info.Author,
                producer: info.Producer,
            },
            structure,
            confidenceScore: Math.min(confidenceScore, 100),
        };

    } catch (error: any) {
        console.error('PDF Parsing Error:', error);
        // Enhance error message
        if (error.name === 'PasswordException') {
            throw new Error('PDF is password protected.');
        }
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}
