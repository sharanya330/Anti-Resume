interface EvaluationResults {
    ats: { verdict: string; issues: string[] };
    recruiter: { verdict: string; comments: string[] };
    engineer: { verdict: string; technicalCriticisms: string[] };
}

export function generateRejectionLetter(candidateName: string | undefined, results: EvaluationResults): string {
    const name = candidateName || 'Candidate';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let reasons: string[] = [];

    // Prioritize reasons based on severity
    if (results.ats.verdict === 'REJECT') {
        reasons.push(...results.ats.issues.slice(0, 2));
    }

    if (results.recruiter.verdict === 'REJECT') {
        reasons.push(...results.recruiter.comments.slice(0, 2));
    }

    if (results.engineer.verdict === 'REJECT') {
        reasons.push(...results.engineer.technicalCriticisms.slice(0, 2));
    }

    // If no hard rejects, pick borderline issues
    if (reasons.length === 0) {
        reasons.push(...results.ats.issues.slice(0, 1));
        reasons.push(...results.recruiter.comments.slice(0, 1));
        reasons.push(...results.engineer.technicalCriticisms.slice(0, 1));
    }

    // Deduplicate and filter empty
    reasons = [...new Set(reasons)].filter(Boolean);

    // If still empty (perfect resume?), invent a generic one (brutally honest: "We found someone better")
    if (reasons.length === 0) {
        reasons.push("While your profile is strong, we identified other candidates with more specific experience in our core stack.");
    }

    const reasonList = reasons.map(r => `• ${r}`).join('\n');

    return `
ANALYSIS REPORT: Why this resume gets rejected

Date: ${date}
Candidate: ${name}

SUMMARY:
This resume is currently optimized for rejection. Based on our simulation, it would likely be dropped during the initial screening phases.

CRITICAL FAILURE POINTS:

${reasonList}

DIAGNOSIS:
The issues above represent the primary "red flags" that trigger automated or manual rejection. Address these to survive the first 6 seconds of a recruiter's scan.
  `.trim();
}
