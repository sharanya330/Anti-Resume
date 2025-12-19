import { ParsedResume, StructuredError } from '../parser/types';

interface EngineerResult {
    verdict: 'PASS' | 'BORDERLINE' | 'REJECT';
    summary: string;
    technicalCriticisms: string[];
    structuredErrors: StructuredError[];
}

const BUZZWORD_CHECKS = [
    { term: 'AI', required: ['pytorch', 'tensorflow', 'keras', 'scikit', 'model', 'training', 'inference', 'llm'] },
    { term: 'Blockchain', required: ['solidity', 'smart contract', 'ethereum', 'web3', 'consensus'] },
    { term: 'Microservices', required: ['docker', 'kubernetes', 'grpc', 'message queue', 'kafka', 'rabbitmq', 'service mesh'] },
];

const DEPTH_INDICATORS = [
    'scaling', 'concurrency', 'latency', 'throughput', 'optimization', 'cache', 'database design',
    'system design', 'architecture', 'security', 'authentication', 'ci/cd', 'testing', 'monitoring'
];

export function evaluateEngineer(resume: ParsedResume): EngineerResult {
    const criticisms: string[] = [];
    const structuredErrors: StructuredError[] = [];
    let score = 100;
    const textLower = resume.rawText.toLowerCase();

    // 1. Buzzword Detection
    BUZZWORD_CHECKS.forEach(check => {
        if (textLower.includes(check.term.toLowerCase())) {
            const hasProof = check.required.some(req => textLower.includes(req));
            if (!hasProof) {
                score -= 20;
                criticisms.push(`BUZZWORD DETECTED: You mentioned "${check.term}" but showed no evidence of using ${check.required.slice(0, 3).join(', ')}. Stop lying.`);
                structuredErrors.push({
                    error_id: 'ENGINEER_BUZZWORD_NO_PROOF',
                    severity: 'high',
                    evaluator: 'Engineer',
                    section: 'Skills',
                    reason: `Mentioned "${check.term}" without evidence (e.g., ${check.required.slice(0, 3).join(', ')}).`,
                    evidence: `Term: ${check.term}`,
                    allowed_fixes: ['remove', 'relink'],
                    disallowed_fixes: ['invent']
                });
            }
        }
    });

    // 2. Technical Depth
    const depthCount = DEPTH_INDICATORS.filter(term => textLower.includes(term)).length;
    if (depthCount < 3) {
        score -= 25;
        criticisms.push('SURFACE LEVEL: Your resume reads like a tutorial user. Mention system design, scaling, or trade-offs.');
        structuredErrors.push({
            error_id: 'ENGINEER_LACK_OF_DEPTH',
            severity: 'high',
            evaluator: 'Engineer',
            section: 'Experience',
            reason: 'Lack of technical depth keywords (scaling, system design, etc.).',
            allowed_fixes: ['rewrite'],
            disallowed_fixes: ['invent', 'exaggerate']
        });
    }

    // 3. Skill -> Project Mapping
    const skillsText = resume.structure.skills.join(' ').toLowerCase();
    const experienceText = (resume.structure.experience.join(' ') + ' ' + resume.structure.projects.join(' ')).toLowerCase();

    const skillList = skillsText.split(/,|•|\n/).map(s => s.trim()).filter(s => s.length > 2);

    if (skillList.length > 0) {
        let unprovenSkills = 0;
        const unprovenList: string[] = [];
        skillList.forEach(skill => {
            if (!experienceText.includes(skill)) {
                unprovenSkills++;
                unprovenList.push(skill);
            }
        });

        const unprovenRatio = unprovenSkills / skillList.length;
        if (unprovenRatio > 0.5) {
            score -= 20;
            criticisms.push(`SKILL STUFFING: You listed ${skillList.length} skills but didn't mention half of them in your experience. Only list what you used.`);
            structuredErrors.push({
                error_id: 'ENGINEER_SKILL_STUFFING',
                severity: 'medium',
                evaluator: 'Engineer',
                section: 'Skills',
                reason: `Listed skills not found in experience: ${unprovenList.slice(0, 5).join(', ')}...`,
                evidence: unprovenList.slice(0, 5).join(', '),
                allowed_fixes: ['remove', 'relink'],
                disallowed_fixes: ['invent']
            });
        }
    }

    // Verdict & Summary
    let verdict: 'PASS' | 'BORDERLINE' | 'REJECT' = 'PASS';
    let summary = "You seem competent.";

    if (score < 60) {
        verdict = 'REJECT';
        summary = "You know tools, not systems.";
    } else if (score < 80) {
        verdict = 'BORDERLINE';
        summary = "Technically okay, but lacks depth.";
    } else {
        summary = "Strong engineering mindset visible.";
    }

    return {
        verdict,
        summary,
        technicalCriticisms: criticisms,
        structuredErrors
    };
}
