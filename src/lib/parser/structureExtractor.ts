import { ResumeStructure } from './types';

export function extractStructure(text: string): ResumeStructure {
    const lines = text.split(/\r?\n/);
    const structure: ResumeStructure = {
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        contact: {
            links: [],
        },
    };

    // Regex patterns for section headers
    const patterns = {
        experience: /^(work\s+)?experience|employment|history|professional\s+experience/i,
        education: /^education|academic|university/i,
        skills: /^skills|technologies|technical\s+skills|competencies/i,
        projects: /^projects|portfolio|personal\s+projects/i,
        certifications: /^certifications|awards|honors|achievements/i,
        summary: /^summary|profile|about|objective/i,
    };

    // Regex for contact info
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/;
    const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(github\.com\/[^\s]+)|(linkedin\.com\/[^\s]+)/g;

    let currentSection: keyof ResumeStructure | null = null;
    let buffer: string[] = [];

    // First pass: Extract contact info globally (often at top)
    const emailMatch = text.match(emailRegex);
    if (emailMatch) structure.contact.email = emailMatch[0];

    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) structure.contact.phone = phoneMatch[0];

    const links = text.match(linkRegex);
    if (links) structure.contact.links = links;

    // Second pass: Section segmentation
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Check if line is a header
        // Heuristic: Short line, often uppercase or title case, matches keywords
        const isHeaderCandidate = line.length < 50;

        if (isHeaderCandidate) {
            if (patterns.experience.test(line)) {
                flushBuffer();
                currentSection = 'experience';
                continue;
            } else if (patterns.education.test(line)) {
                flushBuffer();
                currentSection = 'education';
                continue;
            } else if (patterns.skills.test(line)) {
                flushBuffer();
                currentSection = 'skills';
                continue;
            } else if (patterns.projects.test(line)) {
                flushBuffer();
                currentSection = 'projects';
                continue;
            } else if (patterns.certifications.test(line)) {
                flushBuffer();
                currentSection = 'certifications';
                continue;
            } else if (patterns.summary.test(line)) {
                flushBuffer();
                currentSection = 'summary';
                continue;
            }
        }

        if (currentSection) {
            buffer.push(line);
        } else {
            // If no section found yet, it's likely the header/summary part (if not explicitly labeled)
            // or just garbage. We can treat the top part as implicit summary if it's not contact info.
            if (!structure.summary && buffer.length < 10 && !patterns.summary.test(line)) {
                // simplistic approach: accumulate top lines as summary until a section hits
                // but let's be careful not to include just name/contact
                if (!line.includes('@') && !phoneRegex.test(line)) {
                    // structure.summary += line + '\n'; 
                    // Actually, let's just leave it for now. Explicit sections are safer.
                }
            }
        }
    }

    flushBuffer();

    function flushBuffer() {
        if (currentSection && buffer.length > 0) {
            if (currentSection === 'summary') {
                structure.summary = buffer.join('\n');
            } else if (Array.isArray(structure[currentSection])) {
                // For list sections, we might want to keep them as blocks or lines
                // For now, let's push the whole block as one item, or try to split by bullet points?
                // Let's just join them for now, the evaluators will parse the content.
                // Actually, the type definition says string[]. Let's treat each logical block as an item?
                // Hard to distinguish blocks without visual cues. 
                // Let's just put all lines into one string for now and let the evaluator split it?
                // No, the interface says string[]. Let's try to split by empty lines or bullets.

                // Simple strategy: Join all, then the evaluator will re-parse. 
                // OR: Push each line? No, that breaks paragraphs.
                // Let's push the entire section content as a single string in the first element for now,
                // and let the specific evaluators handle the fine-grained parsing.
                // Wait, that defeats the purpose of structure.

                // Better strategy: Split by double newlines (paragraphs).
                const content = buffer.join('\n');
                // (structure[currentSection] as string[]).push(content); 

                // Even better: The evaluator needs to know "This is the Experience section".
                // So putting it all in one string is fine if the array is just a container.
                // BUT, if we have multiple jobs, we want them separated.
                // Without visual layout, it's hard.
                // Let's just dump the whole text for that section into the array for now.
                (structure[currentSection] as any) = [content];
            }
            buffer = [];
        }
    }

    return structure;
}
