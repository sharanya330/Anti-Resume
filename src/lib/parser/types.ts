export interface ParsedResume {
    rawText: string;
    metadata: {
        pageCount?: number;
        author?: string;
        producer?: string;
    };
    structure: ResumeStructure;
    confidenceScore: number; // 0-100
}

export interface ResumeStructure {
    summary: string;
    experience: string[];
    education: string[];
    skills: string[];
    projects: string[];
    certifications: string[];
    contact: {
        email?: string;
        phone?: string;
        links?: string[];
    };
}

export interface ParserError {
    code: 'FILE_TOO_LARGE' | 'INVALID_FORMAT' | 'PARSING_FAILED' | 'ENCRYPTED';
    message: string;
}

export interface StructuredError {
    error_id: string;
    severity: 'low' | 'medium' | 'high';
    evaluator: 'ATS' | 'Recruiter' | 'Engineer';
    section: 'Skills' | 'Projects' | 'Experience' | 'Education' | 'Summary' | 'General';
    reason: string;
    evidence?: string;
    allowed_fixes: ('remove' | 'rewrite' | 'relink' | 'reorder' | 'normalize')[];
    disallowed_fixes: ('invent' | 'exaggerate' | 'add_fake_metrics')[];
}

export interface CorrectionProposal {
    modified_resume: string;
    changes_made: {
        error_id: string;
        action: string;
        before: string;
        after: string;
    }[];
    unresolved_errors: {
        error_id: string;
        reason: string;
    }[];
}
