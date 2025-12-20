'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import styles from './FileUpload.module.css';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function FileUpload() {
    const [jobRole, setJobRole] = useState('Software Engineer');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const router = useRouter();
    const { trackEvent } = useAnalytics();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const processFile = async (file: File) => {
        if (!file) return;

        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a PDF or DOCX.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File too large. Max 5MB.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setProgressMessage('Parsing resume...');

        trackEvent('analysis_started', { jobRole });

        const progressInterval = setInterval(() => {
            setProgressMessage(prev => {
                if (prev === 'Parsing resume...') return 'Analyzing ATS readiness...';
                if (prev === 'Analyzing ATS readiness...') return 'Evaluating clarity...';
                if (prev === 'Evaluating clarity...') return 'Finalizing report...';
                return prev;
            });
        }, 1200);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('jobRole', jobRole);

            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                throw new Error('Server returned an invalid response.');
            }

            if (!res.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            if (data.data && data.data._id) {
                clearInterval(progressInterval);
                trackEvent('analysis_completed', { success: true });
                router.push(`/results/${data.data._id}`);
            } else {
                throw new Error('No ID returned');
            }

        } catch (err: any) {
            clearInterval(progressInterval);
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [jobRole]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.inputWrapper}>
                <label htmlFor="jobRole" className={styles.label}>Target Role</label>
                <input
                    type="text"
                    id="jobRole"
                    className={styles.textInput}
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    disabled={isLoading}
                />
            </div>

            <div
                className={`${styles.dropzone} ${isDragging ? styles.active : ''} ${isLoading ? styles.loading : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-upload"
                    className={styles.input}
                    onChange={handleChange}
                    accept=".pdf,.docx,.doc"
                    disabled={isLoading}
                />

                <div className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loadingState}>
                            <Loader2 className={styles.spinner} size={48} />
                            <p className={styles.progressText}>{progressMessage}</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.iconWrapper}>
                                <Upload className={styles.icon} size={32} />
                            </div>
                            <div className={styles.textWrapper}>
                                <p className={styles.primaryText}>
                                    Drop your resume here
                                </p>
                                <p className={styles.secondaryText}>
                                    or <span className={styles.link}>browse files</span>
                                </p>
                            </div>
                            <div className={styles.metaWrapper}>
                                <span className={styles.badge}>PDF</span>
                                <span className={styles.badge}>DOCX</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
