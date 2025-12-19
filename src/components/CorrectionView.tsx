'use client';

import { useState } from 'react';
import { CorrectionProposal } from '@/lib/parser/types';
import styles from './CorrectionView.module.css';
import { Check, X, AlertTriangle, Wand2, ArrowRight } from 'lucide-react';

interface Props {
    analysisId: string;
    initialProposal?: CorrectionProposal;
}

export default function CorrectionView({ analysisId, initialProposal }: Props) {
    const [proposal, setProposal] = useState<CorrectionProposal | null>(initialProposal || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/correct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setProposal(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!proposal && !isLoading) {
        return (
            <div className={styles.container}>
                <button onClick={handleGenerate} className={styles.generateButton}>
                    <Wand2 size={20} />
                    Auto-Fix Resume (Beta)
                </button>
                {error && <p className={styles.error}>{error}</p>}
            </div>
        );
    }

    if (isLoading) {
        return <div className={styles.loading}>Generating constrained fixes...</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Proposed Corrections</h2>

            <div className={styles.changesList}>
                {proposal?.changes_made.map((change, i) => (
                    <div key={i} className={styles.changeCard}>
                        <div className={styles.changeHeader}>
                            <span className={styles.errorId}>{change.error_id}</span>
                            <span className={styles.action}>{change.action}</span>
                        </div>
                        <div className={styles.diff}>
                            <div className={styles.before}>
                                <strong>Before:</strong>
                                <p>{change.before}</p>
                            </div>
                            <div className={styles.arrow}>
                                <ArrowRight size={20} />
                            </div>
                            <div className={styles.after}>
                                <strong>After:</strong>
                                <p>{change.after}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {proposal?.unresolved_errors && proposal.unresolved_errors.length > 0 && (
                <div className={styles.unresolved}>
                    <h3>Unresolved Errors (Requires Fabrication)</h3>
                    <ul>
                        {proposal.unresolved_errors.map((err, i) => (
                            <li key={i}>
                                <strong>{err.error_id}:</strong> {err.reason}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={styles.actions}>
                <p className={styles.disclaimer}>
                    * These changes are suggestions based on strict constraints.
                    Review carefully before applying to your real resume.
                </p>
            </div>
        </div>
    );
}
