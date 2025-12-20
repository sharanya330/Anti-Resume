import { ParsedResume } from './types';
import { extractStructure } from './structureExtractor';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Polyfill for pdfjs-dist in Node environment
if (typeof Promise.withResolvers === 'undefined') {
    // @ts-ignore
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

// @ts-ignore
if (typeof DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { };
}

export async function parsePdf(buffer: Buffer): Promise<ParsedResume> {
    try {
        // Convert Buffer to Uint8Array
        const data = new Uint8Array(buffer);

        // Load the document
        const loadingTask = pdfjsLib.getDocument({
            data,
            useSystemFonts: true,
            disableFontFace: true,
            verbosity: 0
        });

        const doc = await loadingTask.promise;
        const numPages = doc.numPages;
        let fullText = '';
        let info: any = {};

        try {
            const meta = await doc.getMetadata();
            info = meta.info || {};
        } catch (e) {
            // ignore
        }

        for (let i = 1; i <= numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        if (fullText.trim().length < 50) {
            throw new Error('PDF content too short or empty.');
        }

        const structure = extractStructure(fullText);

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
        if (error.name === 'PasswordException') {
            throw new Error('PDF is password protected.');
        }
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}
