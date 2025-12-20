import { ParsedResume, StructuredError } from '../parser/types';

interface AtsResult {
    verdict: 'PASS' | 'BORDERLINE' | 'REJECT';
    score: number;
    issues: string[];
    structuredErrors: StructuredError[];
}

const REQUIRED_SECTIONS = ['experience', 'education', 'skills'];
const ROLE_KEYWORDS: Record<string, string[]> = {
    'software engineer': ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'aws', 'docker', 'sql', 'git', 'ci/cd', 'agile', 'rest', 'api'],
    'product manager': ['roadmap', 'stakeholder', 'agile', 'scrum', 'user stories', 'kpi', 'strategy', 'prioritization', 'jira', 'analytics', 'user research'],
    'data scientist': ['python', 'sql', 'machine learning', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'visualization', 'statistics', 'modeling'],
    'designer': ['figma', 'sketch', 'adobe', 'prototyping', 'wireframing', 'user interface', 'user experience', 'usability', 'research', 'interaction'],
    'general': ['communication', 'teamwork', 'problem solving', 'leadership', 'project management']
};

export function evaluateAts(resume: ParsedResume, jobRole: string = 'Software Engineer'): AtsResult {
    const issues: string[] = [];
    const structuredErrors: StructuredError[] = [];
    let score = 100;

    // 0. Deterministic Normalization
    // Ensure inputs are canonicalized to prevent non-determinism
    const normalizedText = resume.rawText.trim().toLowerCase().replace(/\s+/g, ' ');

    // Normalize role
    const normalizedRole = Object.keys(ROLE_KEYWORDS).find(r => jobRole.toLowerCase().includes(r)) || 'general';
    const keywords = ROLE_KEYWORDS[normalizedRole];

    // 1. Check Parsing Confidence
    if (resume.confidenceScore < 50) {
        score -= 40;
        issues.push('CRITICAL: Resume parsing failed or was very low quality. ATS cannot read this.');
        structuredErrors.push({
            error_id: 'ATS_PARSING_FAILURE',
            severity: 'high',
            evaluator: 'ATS',
            section: 'General',
            reason: 'Resume parsing failed or was very low quality.',
            evidence: `Confidence Score: ${resume.confidenceScore}`,
            allowed_fixes: ['normalize'],
            disallowed_fixes: ['invent']
        });
        return { verdict: 'REJECT', score, issues, structuredErrors };
    }

    // 2. Check Required Sections
    REQUIRED_SECTIONS.forEach(section => {
        // @ts-ignore
        if (!resume.structure[section] || resume.structure[section].length === 0) {
            score -= 20;
            issues.push(`MISSING SECTION: Could not find a clear "${section}" section.`);
            structuredErrors.push({
                error_id: `ATS_MISSING_${section.toUpperCase()}`,
                severity: 'high',
                evaluator: 'ATS',
                section: section.charAt(0).toUpperCase() + section.slice(1) as any,
                reason: `Could not find a clear "${section}" section.`,
                allowed_fixes: ['reorder', 'normalize'],
                disallowed_fixes: ['invent']
            });
        }
    });

    // 3. Keyword Matching
    // Use the deterministic normalized text
    const foundKeywords = keywords.filter(kw => normalizedText.includes(kw));
    const keywordMatchRatio = foundKeywords.length / keywords.length;

    if (keywordMatchRatio < 0.3) {
        score -= 25;
        issues.push(`LOW KEYWORD MATCH: Found only ${foundKeywords.length} relevant keywords for ${jobRole} (matched against ${normalizedRole} list). ATS filters will drop this.`);
        structuredErrors.push({
            error_id: 'ATS_LOW_KEYWORD_MATCH',
            severity: 'high',
            evaluator: 'ATS',
            section: 'Skills',
            reason: `Found only ${foundKeywords.length} relevant keywords for ${jobRole}.`,
            evidence: `Found: ${foundKeywords.join(', ')}`,
            allowed_fixes: ['rewrite', 'normalize'],
            disallowed_fixes: ['invent', 'add_fake_metrics']
        });
    } else if (keywordMatchRatio < 0.5) {
        score -= 10;
        issues.push(`WEAK KEYWORD MATCH: Missing common industry terms for ${jobRole}.`);
        structuredErrors.push({
            error_id: 'ATS_WEAK_KEYWORD_MATCH',
            severity: 'medium',
            evaluator: 'ATS',
            section: 'Skills',
            reason: `Missing common industry terms for ${jobRole}.`,
            allowed_fixes: ['rewrite', 'normalize'],
            disallowed_fixes: ['invent']
        });
    }

    // 4. Formatting / Layout Checks (Heuristics)
    // Check for too many short lines (possible column parsing issue)
    const lines = resume.rawText.split('\n');
    const shortLines = lines.filter(l => l.trim().length > 0 && l.trim().length < 20).length;
    if (shortLines / lines.length > 0.5) {
        score -= 15;
        issues.push('FORMATTING: High density of short lines detected. This often indicates broken multi-column parsing. Use a single-column layout.');
        structuredErrors.push({
            error_id: 'ATS_BAD_FORMATTING_COLUMNS',
            severity: 'medium',
            evaluator: 'ATS',
            section: 'General',
            reason: 'High density of short lines detected. This often indicates broken multi-column parsing.',
            allowed_fixes: ['normalize'],
            disallowed_fixes: []
        });
    }

    // Check for contact info
    if (!resume.structure.contact.email && !resume.structure.contact.phone) {
        score -= 30;
        issues.push('CRITICAL: No contact information found. Immediate rejection.');
        structuredErrors.push({
            error_id: 'ATS_MISSING_CONTACT',
            severity: 'high',
            evaluator: 'ATS',
            section: 'General',
            reason: 'No contact information found.',
            allowed_fixes: ['rewrite'],
            disallowed_fixes: ['invent']
        });
    }

    // Verdict Logic
    let verdict: 'PASS' | 'BORDERLINE' | 'REJECT' = 'PASS';
    if (score < 60) verdict = 'REJECT';
    else if (score < 80) verdict = 'BORDERLINE';

    return {
        verdict,
        score,
        issues,
        structuredErrors
    };
}
