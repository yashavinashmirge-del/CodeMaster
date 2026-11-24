
/* //////////////////////////////////////////////////////
   App.jsx
   ------------------------------------------------------
   Description : CodeMaster animated public landing page
   Input       : Visitor interactions and theme selection
   Output      : Responsive programming platform homepage
   Author      : Your Name
   Date        : 23/11/2026
////////////////////////////////////////////////////// */

import { useEffect, useState } from "react";

import {
  Terminal,
  Code2,
  Brain,
  GitBranch,
  BookOpen,
  Search,
  Sun,
  Moon,
  ArrowUpRight,
  Play,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Braces,
} from "lucide-react";

// ---------------------------------------------------
// Landing Page Content
// ---------------------------------------------------

const learningTools = [
  {
    number: "01",
    icon: Code2,
    title: "Code Practice",
    description: "Solve programming challenges and improve your problem-solving skills.",
    tag: "WRITE CODE",
  },
  {
    number: "02",
    icon: Brain,
    title: "Code Tutor",
    description: "Understand programming concepts through guided explanations.",
    tag: "LEARN CONCEPTS",
  },
  {
    number: "03",
    icon: Search,
    title: "Code Analyzer",
    description: "Inspect your code, identify issues and understand improvements.",
    tag: "ANALYZE",
  },
  {
    number: "04",
    icon: GitBranch,
    title: "Dry Run",
    description: "Follow program execution and watch variables change step by step.",
    tag: "TRACE EXECUTION",
  },
  {
    number: "05",
    icon: Braces,
    title: "Code Visualization",
    description: "Explore program flow, data structures and execution visually.",
    tag: "VISUALIZE",
  },
  {
    number: "06",
    icon: BookOpen,
    title: "Learning Notes",
    description: "Read organized programming notes and keep track of your learning.",
    tag: "STUDY",
  },
];

// ---------------------------------------------------
// Main Application Component
// ---------------------------------------------------

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("codemaster-theme") || "dark"
  );

  const [mobileMenu, setMobileMenu] = useState(false);

  // Apply the selected theme throughout the application.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("codemaster-theme", theme);
  }, [theme]);

  // ---------------------------------------------------
  // Function Name : toggleTheme
  // Description   : Switches between dark and light themes
  // Input         : None
  // Output        : Updates the selected theme
  // ---------------------------------------------------

  const toggleTheme = () => {
    setTheme((current) => current === "dark" ? "light" : "dark");
  };

  // ---------------------------------------------------
  // Function Name : closeMenu
  // Description   : Closes the mobile navigation menu
  // Input         : None
  // Output        : Updates mobile menu state
  // ---------------------------------------------------

  const closeMenu = () => {
    setMobileMenu(false);
  };

  return (
    <div className="landing-page">

      {/* ---------------------------------------------------
          Navigation Header
      --------------------------------------------------- */}

      <header className="landing-header">

        <a href="#home" className="landing-brand" onClick={closeMenu}>
          <span className="landing-brand-icon">
            <Terminal size={20} />
          </span>

          <span>
            CodeMaster
            <small>PROGRAMMING ENVIRONMENT</small>
          </span>
        </a>

        <nav className={`landing-nav ${mobileMenu ? "mobile-open" : ""}`}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#tools" onClick={closeMenu}>Learning tools</a>
          <a href="#languages" onClick={closeMenu}>Languages</a>
          <a href="#about" onClick={closeMenu}>About</a>

          <a href="#start" className="mobile-start" onClick={closeMenu}>
            Get started <ArrowUpRight size={15} />
          </a>
        </nav>

        <div className="landing-actions">
          <button
            className="landing-theme-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <a href="#start" className="header-cta">
            Get started <ArrowUpRight size={15} />
          </a>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

      </header>

      <main>

        {/* ---------------------------------------------------
            Hero Section
        --------------------------------------------------- */}

        <section className="hero-section" id="home">

          <div className="hero-grid-background"></div>

          <div className="hero-content">

            <div className="hero-status animate-up">
              <span className="status-dot"></span>
              A FREE PROGRAMMING LEARNING PLATFORM
            </div>

            <h1 className="hero-title animate-up delay-one">
              Don't just write code.
              <br />
              <span>Understand it.</span>
            </h1>

            <p className="hero-description animate-up delay-two">
              Learn programming by writing, analyzing and visualizing code.
              Build real problem-solving skills, one program at a time.
            </p>

            <div className="hero-buttons animate-up delay-three">
              <a href="#start" className="primary-cta">
                Start learning <ArrowUpRight size={17} />
              </a>

              <a href="#tools" className="secondary-cta">
                Explore the tools <ChevronDown size={16} />
              </a>
            </div>

            <div className="hero-meta animate-up delay-four">
              <span><ShieldCheck size={15} /> Free to learn</span>
              <span><Code2 size={15} /> Four languages</span>
              <span><Terminal size={15} /> Hands-on practice</span>
            </div>

          </div>

          {/* ---------------------------------------------------
              Animated Code Editor
          --------------------------------------------------- */}

          <div className="hero-editor-wrap animate-editor">

            <div className="floating-label floating-label-top">
              <span className="status-dot"></span>
              EXECUTION READY
            </div>

            <div className="hero-editor">

              <div className="editor-topbar">
                <div className="editor-window-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <span className="editor-file-name">
                  <Code2 size={14} /> hello_world.c
                </span>

                <span className="editor-language">C</span>
              </div>

              <div className="editor-code">

                <div className="code-line">
                  <span className="code-line-number">01</span>
                  <span><span className="syntax-purple">#include</span> <span className="syntax-green">&lt;stdio.h&gt;</span></span>
                </div>

                <div className="code-line">
                  <span className="code-line-number">02</span>
                </div>

                <div className="code-line">
                  <span className="code-line-number">03</span>
                  <span><span className="syntax-purple">int</span> main() {"{"}</span>
                </div>

                <div className="code-line">
                  <span className="code-line-number">04</span>
                  <span className="code-indent"><span className="syntax-purple">printf</span>(<span className="syntax-green">"Hello, CodeMaster!"</span>);</span>
                </div>

                <div className="code-line">
                  <span className="code-line-number">05</span>
                  <span className="code-indent"><span className="syntax-purple">return</span> <span className="syntax-orange">0</span>;</span>
                </div>

                <div className="code-line">
                  <span className="code-line-number">06</span>
                  <span>{"}"}</span>
                </div>

              </div>

              <div className="editor-output">

                <div className="output-heading">
                  <span>TERMINAL / OUTPUT</span>
                  <span className="output-success">SUCCESS</span>
                </div>

                <div className="output-result">
                  <span className="output-prompt">&gt;</span>
                  Hello, CodeMaster!
                  <span className="typing-cursor"></span>
                </div>

              </div>

              <div className="editor-bottom">
                <span>UTF-8</span>
                <span>C LANGUAGE</span>
                <span>LINE 06 : COL 01</span>
              </div>

            </div>

            <div className="floating-label floating-label-bottom">
              <GitBranch size={15} />
              STEP-BY-STEP EXECUTION
            </div>

          </div>

          <div className="hero-scroll">
            <span>SCROLL TO EXPLORE</span>
            <div className="scroll-line"></div>
          </div>

        </section>

        {/* ---------------------------------------------------
            Platform Statistics
        --------------------------------------------------- */}

        <section className="stats-section">

          <div className="stat-item">
            <strong>04</strong>
            <span>PROGRAMMING LANGUAGES</span>
          </div>

          <div className="stat-item">
            <strong>06</strong>
            <span>LEARNING TOOLS</span>
          </div>

          <div className="stat-item">
            <strong>100%</strong>
            <span>FREE LEARNING ACCESS</span>
          </div>

          <div className="stat-item">
            <strong>∞</strong>
            <span>ROOM TO IMPROVE</span>
          </div>

        </section>

        {/* ---------------------------------------------------
            Learning Tools Section
        --------------------------------------------------- */}

        <section className="tools-section" id="tools">

          <div className="section-intro">
            <span className="section-eyebrow">01 / LEARNING ENVIRONMENT</span>

            <h2>
              Everything you need.
              <br />
              <span>One workspace.</span>
            </h2>

            <p>
              Go beyond memorizing syntax. Learn how programs work,
              why they work and how to solve problems independently.
            </p>
          </div>

          <div className="tools-grid">

            {learningTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <article className="tool-card" key={tool.number}>

                  <div className="tool-card-top">
                    <span className="tool-number">{tool.number}</span>
                    <Icon size={21} />
                  </div>

                  <div className="tool-card-content">
                    <h3>{tool.title}</h3>
                    <p>{tool.description}</p>
                  </div>

                  <div className="tool-card-bottom">
                    <span>{tool.tag}</span>
                    <ArrowUpRight size={17} />
                  </div>

                </article>
              );
            })}

          </div>

        </section>

        {/* ---------------------------------------------------
            Programming Languages Section
        --------------------------------------------------- */}

        <section className="languages-section" id="languages">

          <div className="languages-content">

            <div>
              <span className="section-eyebrow">02 / SUPPORTED LANGUAGES</span>

              <h2>
                Learn the language.
                <br />
                <span>Master the logic.</span>
              </h2>

              <p>
                Start with the programming language you know,
                or choose a new one to explore.
              </p>
            </div>

            <div className="language-cards">

              <div className="language-card">
                <span className="language-index">LANG / 01</span>
                <strong>C</strong>
                <span>STRUCTURED PROGRAMMING</span>
              </div>

              <div className="language-card">
                <span className="language-index">LANG / 02</span>
                <strong>C++</strong>
                <span>OBJECT-ORIENTED PROGRAMMING</span>
              </div>

              <div className="language-card">
                <span className="language-index">LANG / 03</span>
                <strong>Java</strong>
                <span>OBJECT-ORIENTED PROGRAMMING</span>
              </div>

              <div className="language-card">
                <span className="language-index">LANG / 04</span>
                <strong>JavaScript</strong>
                <span>WEB PROGRAMMING</span>
              </div>

            </div>

          </div>

        </section>

        {/* ---------------------------------------------------
            About and Final Call to Action
        --------------------------------------------------- */}

        <section className="final-section" id="about">

          <div className="final-content">
            <span className="section-eyebrow">03 / THE CODEMASTER APPROACH</span>

            <h2>
              Better understanding.
              <br />
              <span>Better programming.</span>
            </h2>

            <p>
              CodeMaster brings practice, learning and program execution
              together in one place. Built for students and beginners.
            </p>

            <a href="#start" className="primary-cta" id="start">
              Enter CodeMaster <ArrowUpRight size={17} />
            </a>
          </div>

          <div className="final-terminal">
            <div className="final-terminal-heading">
              <Terminal size={17} />
              <span>YOUR NEXT STEP</span>
            </div>

            <div className="terminal-message">
              <span className="terminal-muted">codemaster@learning:~$</span>
              <br />
              <span className="syntax-green">start_learning</span>
              <br />
              <br />
              <span className="terminal-muted">Initializing your programming journey...</span>
              <br />
              <span className="syntax-green">[ READY ]</span>
              <span className="typing-cursor"></span>
            </div>
          </div>

        </section>

      </main>

      {/* ---------------------------------------------------
          Footer
      --------------------------------------------------- */}

      <footer className="landing-footer">

        <a href="#home" className="footer-brand">
          <Terminal size={17} />
          CodeMaster
        </a>

        <span>LEARN. WRITE. UNDERSTAND.</span>

        <span>© 2026 CODEMASTER</span>

      </footer>

    </div>
  );
}

export default App;
