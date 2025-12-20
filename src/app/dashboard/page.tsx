'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

interface DashboardStats {
    totalEvents: number;
    uniqueUsers: number;
    analysisStarted: number;
    analysisCompleted: number;
    dailyUsage: { _id: string; count: number }[];
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className={styles.container}>Loading stats...</div>;
    if (!stats) return <div className={styles.container}>Error loading stats.</div>;

    return (
        <div className={styles.container}>
            <h1>Internal Analytics Dashboard</h1>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Unique Users</h3>
                    <p className={styles.number}>{stats.uniqueUsers}</p>
                </div>
                <div className={styles.card}>
                    <h3>Analyses Started</h3>
                    <p className={styles.number}>{stats.analysisStarted}</p>
                </div>
                <div className={styles.card}>
                    <h3>Analyses Completed</h3>
                    <p className={styles.number}>{stats.analysisCompleted}</p>
                </div>
                <div className={styles.card}>
                    <h3>Total Events</h3>
                    <p className={styles.number}>{stats.totalEvents}</p>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Daily Page Views (Last 7 Days)</h2>
                <div className={styles.chart}>
                    {stats.dailyUsage.map(day => (
                        <div key={day._id} className={styles.barGroup}>
                            <div
                                className={styles.bar}
                                style={{ height: `${Math.min(day.count * 5, 200)}px` }}
                            ></div>
                            <span className={styles.label}>{day._id}</span>
                            <span className={styles.count}>{day.count}</span>
                        </div>
                    ))}
                    {stats.dailyUsage.length === 0 && <p>No data yet.</p>}
                </div>
            </div>
        </div>
    );
}
