import React from 'react';
import './LandingPage.css';

const LandingPage = ({ loginWithGoogle, loginWithPhone, authError }) => {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="logo">NoteGem</div>
      </header>

      <main>
        <section className="hero">
          <h1>Study Smarter, Not Harder</h1>
          <p>Upload your college PDF and get AI-powered exam notes, formula banks, memory hooks and more — in seconds.</p>
          <div className="cta-group">
            <button className="btn-primary" onClick={loginWithGoogle}>Sign in with Google</button>
            <button className="btn-secondary" onClick={loginWithPhone}>Continue with Phone</button>
          </div>
          {authError && <p className="error-message" role="alert">{authError}</p>}
        </section>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Upload Any PDF</h3>
            <p>Textbooks, slides, notes — any college PDF works</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI-Powered Notes</h3>
            <p>Get exam tips, summaries, formula banks and memory hooks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Results</h3>
            <p>Notes ready in seconds, download as PDF</p>
          </div>
        </section>

        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <p>Upload your PDF</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <p>AI analyzes and structures the content</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <p>Download your exam-ready notes</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>NoteGem © 2026 — Built for students, by students</p>
      </footer>
    </div>
  );
};

export default LandingPage;
