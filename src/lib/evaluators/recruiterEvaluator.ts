import { ParsedResume, StructuredError } from '../parser/types';

interface RecruiterResult {
    verdict: 'PASS' | 'BORDERLINE' | 'REJECT';
    score: number;
    comments: string[];
    structuredErrors: StructuredError[];
}

const GENERIC_PHRASES = [
    'hardworking', 'team player', 'passionate', 'motivated', 'results-oriented',
    'detail-oriented', 'go-getter', 'synergy', 'thought leader', 'ninja', 'rockstar'
];

export function evaluateRecruiter(resume: ParsedResume): RecruiterResult {
    const comments: string[] = [];
    const structuredErrors: StructuredError[] = [];
    let score = 100;

    // 1. The "6-Second Scan"
    if (!resume.structure.summary || resume.structure.summary.length > 400) {
        score -= 10;
        comments.push('SCANABILITY: Summary is either missing or too long. Keep it to 3 lines max.');
        structuredErrors.push({
            error_id: 'RECRUITER_BAD_SUMMARY',
            severity: 'medium',
            evaluator: 'Recruiter',
            section: 'Summary',
            reason: 'Summary is either missing or too long.',
            allowed_fixes: ['rewrite', 'remove'],
            disallowed_fixes: ['invent']
        });
    }

    // Check if experience is easy to read (bullet points)
    const experienceText = resume.structure.experience.join('\n');
    const bulletCount = (experienceText.match(/•|-|\*/g) || []).length;

    if (bulletCount < 5 && experienceText.length > 500) {
        score -= 20;
        comments.push('READABILITY: Wall of text detected in Experience. Use bullet points.');
        structuredErrors.push({
            error_id: 'RECRUITER_WALL_OF_TEXT',
            severity: 'high',
            evaluator: 'Recruiter',
            section: 'Experience',
            reason: 'Wall of text detected. Use bullet points.',
            allowed_fixes: ['normalize'],
            disallowed_fixes: []
        });
    }

    // 2. Generic Phrases
    const textLower = resume.rawText.toLowerCase();
    const foundGeneric = GENERIC_PHRASES.filter(phrase => textLower.includes(phrase));

    if (foundGeneric.length > 0) {
        score -= 5 * foundGeneric.length;
        comments.push(`CLICHÉ ALERT: Stop using empty words like "${foundGeneric.join('", "')}". Show, don't tell.`);
        structuredErrors.push({
            error_id: 'RECRUITER_CLICHES',
            severity: 'medium',
            evaluator: 'Recruiter',
            section: 'General',
            reason: `Found generic clichés: ${foundGeneric.join(', ')}`,
            evidence: foundGeneric.join(', '),
            allowed_fixes: ['remove', 'rewrite'],
            disallowed_fixes: ['invent']
        });
    }

    // 3. Metrics & Outcomes
    const metricsCount = (experienceText.match(/\d+%|\$\d+|\d+x|\d+\s+users|\d+\s+clients/g) || []).length;

    if (metricsCount === 0) {
        score -= 25;
        comments.push('NO METRICS: You listed responsibilities, not achievements. Where are the numbers? (%, $, users, speedup)');
        structuredErrors.push({
            error_id: 'RECRUITER_NO_METRICS',
            severity: 'high',
            evaluator: 'Recruiter',
            section: 'Experience',
            reason: 'No quantified metrics found.',
            allowed_fixes: ['rewrite'],
            disallowed_fixes: ['add_fake_metrics', 'invent']
        });
    } else if (metricsCount < 3) {
        score -= 10;
        comments.push('WEAK IMPACT: Add more quantified results. "Improved performance" means nothing. "Improved performance by 20%" gets you hired.');
        structuredErrors.push({
            error_id: 'RECRUITER_WEAK_METRICS',
            severity: 'medium',
            evaluator: 'Recruiter',
            section: 'Experience',
            reason: 'Few quantified metrics found.',
            allowed_fixes: ['rewrite'],
            disallowed_fixes: ['add_fake_metrics', 'invent']
        });
    }

    // 4. Length Check
    if (resume.rawText.length > 6000) {
        score -= 15;
        comments.push('LENGTH: Your resume is too long. Senior engineers need 1 page. You are not the CEO.');
        structuredErrors.push({
            error_id: 'RECRUITER_TOO_LONG',
            severity: 'medium',
            evaluator: 'Recruiter',
            section: 'General',
            reason: 'Resume is too long.',
            allowed_fixes: ['remove', 'rewrite'],
            disallowed_fixes: []
        });
    }

    // Verdict
    let verdict: 'PASS' | 'BORDERLINE' | 'REJECT' = 'PASS';
    if (score < 60) verdict = 'REJECT';
    else if (score < 80) verdict = 'BORDERLINE';

    return {
        verdict,
        score,
        comments,
        structuredErrors
    };
}
