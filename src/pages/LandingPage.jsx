import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">✨</span>
            <span className="logo-text">TailorAI</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              AI-Powered Resume Optimizer
            </h1>
            <p className="hero-subtitle">
              Tailor your resume to match any job description in seconds. 
              Boost your chances of landing interviews with AI-optimized resumes.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn-cta">Start Optimizing Free</Link>
              <a href="#how-it-works" className="btn-secondary">Learn More</a>
            </div>
            <div className="hero-badges">
              <div className="badge">
                <span className="badge-icon">🚀</span>
                <span>Instant Results</span>
              </div>
              <div className="badge">
                <span className="badge-icon">🎯</span>
                <span>Perfect Match</span>
              </div>
              <div className="badge">
                <span className="badge-icon">📊</span>
                <span>Track Applications</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="card-header">
                <div className="card-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="card-content">
                <div className="resume-preview">
                  <div className="preview-line long"></div>
                  <div className="preview-line medium"></div>
                  <div className="preview-line short"></div>
                  <div className="preview-section">
                    <div className="preview-line medium"></div>
                    <div className="preview-line long"></div>
                    <div className="preview-line medium"></div>
                  </div>
                </div>
                <div className="ai-overlay">
                  <div className="ai-pulse"></div>
                  <span className="ai-text">AI Optimizing...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">Everything you need to land your dream job</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Optimization</h3>
              <p>Our advanced AI analyzes job descriptions and tailors your resume to maximize your match score.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Save & Organize</h3>
              <p>Keep track of all your tailored resumes and job applications in one centralized dashboard.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Results</h3>
              <p>Get your optimized resume in seconds. No waiting, no hassle, just results.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Access your resumes anywhere, anytime. Our platform works seamlessly on all devices.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Professional Templates</h3>
              <p>Choose from beautifully designed templates that recruiters love.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your data is encrypted and secure. We take your privacy seriously.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to your perfect resume</p>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Upload Your Resume</h3>
                <p>Start with your existing resume or create a new one from scratch.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Paste Job Description</h3>
                <p>Copy and paste the job description you're interested in applying for.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get Optimized Resume</h3>
                <p>Our AI analyzes and tailors your resume to match the job perfectly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Land Your Dream Job?</h2>
            <p>Join thousands of job seekers who have optimized their resumes with TailorAI</p>
            <Link to="/register" className="btn-cta-large">Get Started for Free</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="logo">
                <span className="logo-icon">✨</span>
                <span className="logo-text">TailorAI</span>
              </div>
              <p>AI-powered resume optimization for job seekers.</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/register">Sign Up</Link>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
              <a href="#privacy">Privacy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 TailorAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
