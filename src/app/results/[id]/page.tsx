import dbConnect from '@/lib/db/connect';
import Analysis from '@/lib/db/models/Analysis';
import styles from './page.module.css';
import { AlertTriangle, XCircle, CheckCircle, FileText, User, Code } from 'lucide-react';
import Link from 'next/link';
import CorrectionView from '@/components/CorrectionView';

async function getAnalysis(id: string) {
    await dbConnect();
    const analysis = await Analysis.findById(id).lean();
    if (!analysis) return null;
    // Serialize for client component if needed, but here we render on server
    return JSON.parse(JSON.stringify(analysis));
}

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const analysis = await getAnalysis(id);

    if (!analysis) {
        return <div className={styles.container}>Analysis not found.</div>;
    }

    const { ats, recruiter, engineer } = analysis.evaluations;

    const getVerdictColor = (verdict: string) => {
        if (verdict === 'PASS') return styles.pass;
        if (verdict === 'BORDERLINE') return styles.borderline;
        return styles.reject;
    };

    const getVerdictIcon = (verdict: string) => {
        if (verdict === 'PASS') return <CheckCircle size={24} />;
        if (verdict === 'BORDERLINE') return <AlertTriangle size={24} />;
        return <XCircle size={24} />;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>← Analyze Another</Link>
                <h1 className={styles.title}>Rejection Report</h1>
                <p className={styles.subtitle}>For {analysis.originalFilename}</p>
            </header>

            <div className={styles.grid}>
                {/* Rejection Letter */}
                <section className={styles.letterSection}>
                    <h2 className={styles.sectionTitle}>The Verdict</h2>
                    <div className={styles.letter}>
                        <pre className={styles.letterContent}>{analysis.rejectionLetter}</pre>
                    </div>
                </section>

                {/* Detailed Breakdown */}
                <section className={styles.detailsSection}>

                    {/* ATS */}
                    <div className={`${styles.card} ${getVerdictColor(ats.verdict)}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                <FileText size={20} />
                                <h3>ATS Bot</h3>
                            </div>
                            <div className={styles.score}>{ats.score}/100</div>
                        </div>
                        <div className={styles.verdict}>{ats.verdict}</div>
                        <ul className={styles.issueList}>
                            {ats.issues.map((issue: string, i: number) => (
                                <li key={i}>{issue}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Recruiter */}
                    <div className={`${styles.card} ${getVerdictColor(recruiter.verdict)}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                <User size={20} />
                                <h3>Recruiter (6s Scan)</h3>
                            </div>
                            <div className={styles.score}>{recruiter.score}/100</div>
                        </div>
                        <div className={styles.verdict}>{recruiter.verdict}</div>
                        <ul className={styles.issueList}>
                            {recruiter.comments.map((comment: string, i: number) => (
                                <li key={i}>{comment}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Engineer */}
                    <div className={`${styles.card} ${getVerdictColor(engineer.verdict)}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                <Code size={20} />
                                <h3>Senior Engineer</h3>
                            </div>
                            <div className={styles.score}>{engineer.score || '?'}</div>
                        </div>
                        <div className={styles.verdict}>{engineer.verdict}</div>
                        <p className={styles.summary}>"{engineer.summary}"</p>
                        <ul className={styles.issueList}>
                            {engineer.technicalCriticisms.map((crit: string, i: number) => (
                                <li key={i}>{crit}</li>
                            ))}
                        </ul>
                    </div>

                </section>
            </div>

            {/* AI Correction Engine */}
            <CorrectionView
                analysisId={id}
                initialProposal={analysis.correctionSuggestions}
            />
        </div >
    );
}
