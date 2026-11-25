/*
 * ============================================================
 * File Name     : LandingPage.jsx
 * Description   : Introduces CodeMaster and routes visitors into learning.
 * Module        : Public Pages
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Braces, Code2, GitBranch, Moon, Sun, Terminal } from "lucide-react";

const languages = ["C", "C++", "Java", "JavaScript"];

/*
 * ============================================================
 * Function Name : LandingPage
 * Description   : Presents CodeMaster's free programming learning features.
 * Input         : None.
 * Output        : Public landing page with working registration links.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export default function LandingPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem("codemaster-theme") || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("codemaster-theme", theme);
  }, [theme]);
  return (
    <main className="landing-page product-landing">
      <header className="landing-header">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-icon"><Terminal size={19} /></span>
          <span>CodeMaster<small>PROGRAMMING ENVIRONMENT</small></span>
        </Link>
        <nav className="landing-nav">
          <a href="#tools">Learning tools</a><a href="#languages">Languages</a>
        </nav>
        <div className="landing-actions">
          <button className="landing-theme-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle color theme">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
          <Link className="header-login" to="/login">Log in</Link>
          <Link className="header-cta" to="/register">Start learning <ArrowUpRight size={15} /></Link>
        </div>
      </header>

      <section className="hero-section product-hero">
        <div className="hero-content">
          <div className="hero-status"><span className="status-dot" />A FREE PROGRAMMING LEARNING PLATFORM</div>
          <h1 className="hero-title">Don't just write code.<br /><span>Understand it.</span></h1>
          <p className="hero-description">Learn programming by reading lessons, tracing logic, and solving problems in C, C++, Java, and JavaScript.</p>
          <div className="hero-buttons">
            <Link className="primary-cta" to="/register">Create your free account <ArrowUpRight size={16} /></Link>
            <Link className="secondary-cta" to="/login">I already have an account</Link>
          </div>
          <div className="hero-meta"><span><BookOpen size={15} /> Guided lessons</span><span><Code2 size={15} /> Hands-on practice</span><span><GitBranch size={15} /> Step-by-step learning</span></div>
        </div>
        <div className="hero-editor-wrap">
          <div className="floating-label floating-label-top"><span className="status-dot" />A FIRST PROGRAM</div>
          <div className="hero-editor">
            <div className="editor-topbar"><div className="editor-window-dots"><span /><span /><span /></div><span className="editor-file-name"><Braces size={14} /> hello_world.js</span><span className="editor-language">JS</span></div>
            <pre className="landing-code"><span className="syntax-purple">const</span> learner = <span className="syntax-green">"you"</span>;<br /><br /><span className="syntax-purple">function</span> <span className="syntax-orange">startLearning</span>() {'{'}<br />  console.log(<span className="syntax-green">"Hello, "</span> + learner);<br />{'}'}<br /><br /><span className="syntax-orange">startLearning</span>();</pre>
            <div className="editor-output"><div className="output-heading"><span>TERMINAL / OUTPUT</span><span className="output-success">READY</span></div><div className="output-result"><span className="output-prompt">&gt;</span> Hello, you</div></div>
            <div className="editor-bottom"><span>UTF-8</span><span>JAVASCRIPT</span><span>LINE 07 : COL 01</span></div>
          </div>
          <div className="floating-label floating-label-bottom"><GitBranch size={14} /> LEARN BY DOING</div>
        </div>
      </section>

      <section className="stats-section" id="languages">
        {languages.map((language, index) => <div className="stat-item" key={language}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{language.toUpperCase()}</span></div>)}
      </section>

      <section className="tools-section" id="tools">
        <div className="section-intro"><h2>Practice the way you learn.</h2><p>Keep lessons, notes, questions, and your progress in one focused workspace.</p></div>
        <div className="tools-grid">
          {[{ icon: BookOpen, title: "Structured lessons", text: "Move from a clear explanation to a short example, one concept at a time." }, { icon: Code2, title: "Code practice", text: "Work through beginner-friendly questions and review your submissions." }, { icon: GitBranch, title: "Your progress", text: "Save lessons, mark topics complete, and see where you left off." }].map(({ icon: Icon, title, text }) => <article className="tool-card" key={title}><div className="tool-card-top"><Icon size={20} /></div><div className="tool-card-content"><h3>{title}</h3><p>{text}</p></div><div className="tool-card-bottom"><span>IN YOUR WORKSPACE</span><ArrowUpRight size={16} /></div></article>)}
        </div>
      </section>
      <footer className="landing-footer"><Link to="/" className="footer-brand"><Terminal size={16} /> CodeMaster</Link><span>LEARN. WRITE. UNDERSTAND.</span><span>Free to learn</span></footer>
    </main>
  );
}
