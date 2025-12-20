'use client';

import FileUpload from "@/components/FileUpload";
import styles from "./page.module.css";
import { ArrowDown, CheckCircle2, AlertTriangle, Shield, Zap, FileSearch, BrainCircuit } from 'lucide-react';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <div className={styles.heroContent}>
          <h1 className={`${styles.title} animate-fade-in animate-delay-100`}>
            Why aren't you getting hired?
          </h1>
          <p className={`${styles.tagline} animate-fade-in animate-delay-200`}>
            Stop guessing. Upload your resume and get a brutal, data-driven analysis of exactly what's holding you back.
          </p>

          <div className={`${styles.uploadContainer} animate-fade-in animate-delay-300`}>
            <FileUpload />
          </div>

          <div className={`${styles.socialProof} animate-fade-in animate-delay-300`}>
            <p>Trusted by candidates from top tech companies</p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>The Silent Rejection</h2>
          <p className={styles.sectionSubtitle}>Most resumes fail before a human ever reads them.</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.red}`}>
              <FileSearch size={24} />
            </div>
            <h3>ATS Invisibility</h3>
            <p>Modern ATS parsers choke on complex layouts, columns, and graphics. If the bot can't read it, you don't exist.</p>
          </div>
          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.yellow}`}>
              <Zap size={24} />
            </div>
            <h3>The 6-Second Scan</h3>
            <p>Recruiters spend an average of 6 seconds on a resume. Walls of text and generic summaries get skipped instantly.</p>
          </div>
          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.blue}`}>
              <Shield size={24} />
            </div>
            <h3>Zero Evidence</h3>
            <p>Listing "Java" isn't enough. Engineering managers look for depth, context, and proof of complexity.</p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Engineering-Grade Analysis</h2>
          <p className={styles.sectionSubtitle}>We don't just "check grammar". We deconstruct your career signal.</p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureHeader}>
              <BrainCircuit className={styles.featureIcon} />
              <h3>Constrained AI Correction</h3>
            </div>
            <p>Our engine fixes formatting and phrasing errors <strong>without hallucinating</strong> facts. It's a diff-based, safe correction system.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureHeader}>
              <CheckCircle2 className={styles.featureIcon} />
              <h3>Deep Signal Verification</h3>
            </div>
            <p>We cross-reference your skills with your project descriptions to ensure you're proving what you claim.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureHeader}>
              <FileSearch className={styles.featureIcon} />
              <h3>ATS Simulation</h3>
            </div>
            <p>See exactly what the robot sees. We render the raw text output so you can spot parsing errors immediately.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.brand}>
            <h3>Anti-Resume</h3>
            <p>Brutally honest career tools.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Project</h4>
              <a href="https://github.com/sharanya330/Anti-Resume" target="_blank">GitHub</a>
              <a href="#">Documentation</a>
            </div>
            <div className={styles.linkGroup}>
              <h4>Creator</h4>
              <span>Gantela Sai Sharanya</span>
              <a href="mailto:contact@antiresume.com">Contact</a>
            </div>
          </div>
        </div>
        <div className={styles.copyright}>
          © {new Date().getFullYear()} Anti-Resume. Open Source.
        </div>
      </footer>
    </div>
  );
}
