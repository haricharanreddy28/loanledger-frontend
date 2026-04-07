import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';
import '../styles/home.css';
import '../styles/footer.css';

/* ── Static data ────────────────────────────────────────── */
const ROLES = [
  {
    key: 'borrower',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: 'Borrower',
    desc: 'Apply for loans, track EMI schedules, and view your complete repayment history.',
  },
  {
    key: 'lender',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="#2e7d5b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: 'Lender',
    desc: 'Fund loan applications, monitor portfolio returns, and manage active investments.',
  },
  {
    key: 'analyst',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Analyst',
    desc: 'Review loan applications, assess credit risk, and approve or reject submissions.',
  },
  {
    key: 'admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="#991b1b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Admin',
    desc: 'Manage users, configure platform settings, and oversee all system operations.',
  },
];

const SERVICES = [
  { title: 'Loan Applications',  desc: 'Borrowers submit and track applications through a guided digital workflow.' },
  { title: 'EMI Scheduling',     desc: 'Automated repayment schedules with overdue alerts and payment history.' },
  { title: 'Risk Assessment',    desc: 'Analysts review credit profiles and approve or reject loan submissions.' },
  { title: 'Lender Portfolio',   desc: 'Lenders monitor funded loans, track returns, and manage their portfolio.' },
  { title: 'Role-Based Access',  desc: 'JWT-secured authentication ensuring each user only sees what they need.' },
  { title: 'Admin Controls',     desc: 'Full platform management including user accounts and system configuration.' },
];

const NAV_LINKS = ['About', 'Services', 'Contact'];

/* ══════════════════════════════════════════════════════════
   HOMEPAGE COMPONENT
══════════════════════════════════════════════════════════ */
const HomePage = () => {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [activeNav, setActiveNav] = useState('');

  const handleNavClick = (label) => {
    setActiveNav(label);
    setMenuOpen(false);
  };

  return (
    <div className="home-container">

      {/* ── NAVBAR ───────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <Link to="/home" className="home-nav-brand">Loan Ledger</Link>

          <button
            className="home-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>

          <div className={`home-nav-links${menuOpen ? ' open' : ''}`}>
            {NAV_LINKS.map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className={`home-nav-link${activeNav === label ? ' active' : ''}`}
                onClick={() => handleNavClick(label)}
              >
                {label}
              </a>
            ))}
            <Link
              to="/login"
              className="home-nav-login"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-badge">
          <span className="home-hero-badge-dot" />
          Loan Management Platform
        </div>
        <h1 className="home-hero-title">Loan Ledger</h1>
        <p className="home-hero-subtitle">
          A simple platform for Borrowers, Lenders, Analysts, and Admins
          to manage loans efficiently.
        </p>
        <div className="home-ctas">
          <Link to="/register" className="btn-primary">Get Started</Link>
          <Link to="/login"    className="btn-secondary">Login</Link>
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────── */}
      <section className="home-section bg-soft">
        <div className="section-inner">
          <div className="section-hd">
            <span className="section-badge">Who it's for</span>
            <h2 className="section-title">Built for every role in the lending process</h2>
          </div>
          <div className="role-grid">
            {ROLES.map(role => (
              <div key={role.key} className={`role-card ${role.key}`}>
                <div className="role-icon">{role.icon}</div>
                <div className="role-title">{role.title}</div>
                <div className="role-desc">{role.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────── */}
      <section id="about" className="home-section bg-white">
        <div className="section-inner">
          <div className="section-hd">
            <span className="section-badge">About</span>
            <h2 className="section-title">What is Loan Ledger?</h2>
          </div>
          <div className="home-about-box">
            <p className="section-body">
              Loan Ledger is a full-stack loan management system built with React and Spring Boot.
              It provides dedicated dashboards for Borrowers, Lenders, Analysts, and Admins —
              each with the exact tools their role requires. Loans are managed end-to-end:
              from application and risk review to disbursement and repayment tracking.
            </p>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────── */}
      <section id="services" className="home-section bg-soft">
        <div className="section-inner">
          <div className="section-hd">
            <span className="section-badge">Platform Features</span>
            <h2 className="section-title">What the platform does</h2>
          </div>
          <div className="home-svc-grid">
            {SERVICES.map(svc => (
              <div key={svc.title} className="home-svc-card">
                <div className="home-svc-title">{svc.title}</div>
                <div className="home-svc-desc">{svc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────── */}
      <section id="contact" className="home-section bg-white">
        <div className="section-inner">
          <div className="section-hd">
            <span className="section-badge">Contact</span>
            <h2 className="section-title">Get in touch</h2>
            <p className="section-body">Have a question about the platform? Send us a message.</p>
          </div>
          <div className="home-contact-wrap">
            <ContactForm />
            <div className="home-contact-meta">
              <span>support@loanledger.in</span>
              <span>Mon–Fri, 9:00 AM – 6:00 PM IST · Bengaluru, India</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="ll-footer">
        <div className="ll-footer-inner">
          <span className="ll-footer-copy">© 2026 Loan Ledger · FSAD Academic Project</span>
          <div className="ll-footer-links">
            <Link to="/login"    className="ll-footer-link">Login</Link>
            <Link to="/register" className="ll-footer-link">Register</Link>
            <a    href="#about"  className="ll-footer-link">About</a>
            <a    href="#contact" className="ll-footer-link">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

/* ── Contact Form ─────────────────────────────────────────── */
const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        className="home-inp"
        placeholder="Full Name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        required
      />
      <input
        className="home-inp"
        type="email"
        placeholder="Email Address"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        required
      />
      <textarea
        className="home-inp home-textarea"
        placeholder="Your message…"
        value={form.message}
        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        required
      />
      <button type="submit" className="home-submit-btn">Send Message</button>
      {sent && (
        <div className="home-form-sent">
          ✓ Message sent. We'll get back to you shortly.
        </div>
      )}
    </form>
  );
};

export default HomePage;
