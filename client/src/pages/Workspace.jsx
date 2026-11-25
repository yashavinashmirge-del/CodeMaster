/*
 * ============================================================
 * File Name     : Workspace.jsx
 * Description   : Student dashboards, learning pages, and practice tools.
 * Module        : Learning Workspace
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, ChevronRight, CircleHelp, Code2, FileText, Gauge, GitBranch, History, LogOut, Menu, Moon, Play, Search, Settings2, Shield, Sparkles, Sun, Terminal, Users, X } from "lucide-react";
import { useAuth } from "../context/authContext.js";
import { dryRunJavaScript } from "../utils/dryRun.js";
import { optimizeCode } from "../utils/codeOptimizer.js";
import api from "../services/api.js";

const languageNames = { c: "C", cpp: "C++", java: "Java", javascript: "JavaScript" };
const starterCode = {
  c: "#include <stdio.h>\n\nint main(void) {\n    int first, second;\n    scanf(\"%d %d\", &first, &second);\n    printf(\"%d\\n\", first + second);\n    return 0;\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int first, second;\n    cin >> first >> second;\n    cout << first + second << '\\n';\n}",
  java: "import java.util.Scanner;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        int first = input.nextInt();\n        int second = input.nextInt();\n        System.out.println(first + second);\n    }\n}",
  javascript: "const fs = require('fs');\nconst [first, second] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(first + second);",
};

/*
 * ============================================================
 * Function Name : messageFromError
 * Description   : Selects a readable API error message with recovery context.
 * Input         : Axios or browser request error.
 * Output        : A short user-facing message.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const messageFromError = (error) => error.response?.data?.message || "The request could not be completed. Check the backend connection and try again.";

/*
 * ============================================================
 * Function Name : WorkspaceLayout
 * Description   : Provides responsive navigation for the signed-in workspace.
 * Input         : Authenticated user and nested route content.
 * Output        : Sidebar, mobile navigation, header, and route outlet.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("codemaster-theme") || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("codemaster-theme", theme);
  }, [theme]);
  const admin = user.role === "admin" || user.role === "superadmin";
  const nav = [
    { label: "Overview", to: "/dashboard", icon: Gauge },
    { label: "Languages", to: "/languages", icon: Code2 },
    { label: "Topics", to: "/topics", icon: GitBranch },
    { label: "Lessons", to: "/lessons", icon: BookOpen },
    { label: "Practice", to: "/practice", icon: Terminal },
    { label: "Dry run", to: "/dry-run", icon: Activity },
    { label: "Notes", to: "/notes", icon: FileText },
    { label: "Bookmarks", to: "/bookmarks", icon: Bookmark },
    { label: "Submissions", to: "/submissions", icon: History },
    { label: "Analytics", to: "/analytics", icon: Activity },
    { label: "Learning assistant", to: "/assistant", icon: CircleHelp },
    ...(admin ? [{ label: "Content studio", to: "/admin/content", icon: Settings2 }] : []),
    ...(user.role === "superadmin" ? [{ label: "User accounts", to: "/superadmin/users", icon: Users }] : []),
  ];

  return (
    <div className="workspace-shell">
      <aside className={`workspace-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <Link className="workspace-brand" to="/dashboard"><span className="brand-mark"><Terminal size={19} /></span><span>CodeMaster<small>LEARNING WORKSPACE</small></span></Link>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {nav.map(({ label, to, icon: Icon }) => <NavLink end={to === "/dashboard"} onClick={() => setMobileOpen(false)} className={({ isActive }) => `side-link ${isActive ? "active" : ""}`} key={to} to={to}><Icon size={17} /><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip"><span className="user-avatar">{user.name?.slice(0, 1).toUpperCase()}</span><span className="user-chip-copy"><strong>{user.name}</strong><small>{user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Student"}</small></span></div>
          <button className="side-link side-logout" onClick={logout}><LogOut size={17} /><span>Log out</span></button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="icon-button mobile-nav-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
          <div className="breadcrumbs"><span>CodeMaster</span><ChevronRight size={14} /><strong>Learning workspace</strong></div>
          <div className="topbar-actions"><span className="role-chip"><Shield size={13} />{user.role}</span><button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle color theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><span className="topbar-avatar">{user.name?.slice(0, 1).toUpperCase()}</span></div>
        </header>
        <main className="workspace-content"><Outlet /></main>
      </div>
      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    </div>
  );
}

/*
 * ============================================================
 * Function Name : DashboardPage
 * Description   : Shows persisted learning totals and a clear next action.
 * Input         : Authenticated student or staff session.
 * Output        : Overview, current curriculum, and recent submissions.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    Promise.all([api.get("/learning/overview"), api.get("/content", { params: { kind: "lesson", limit: 8 } })])
      .then(([overview, lessonResult]) => { setData(overview.data.overview); setLessons(lessonResult.data.items); })
      .catch((requestError) => setError(messageFromError(requestError)))
      .finally(() => setBusy(false));
  }, []);
  const greeting = user.name?.split(" ")[0] || "Learner";
  return <>
    <div className="page-heading"><div><p className="page-kicker">YOUR WORKSPACE</p><h1>Good to see you, {greeting}.</h1><p>Pick up a lesson, try a practice problem, or review what you’ve saved.</p></div><Link className="primary-cta" to="/lessons">Browse lessons <ArrowRight size={16} /></Link></div>
    {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
    {busy ? <LoadingState label="Loading your learning activity…" /> : data && <section className="overview-strip" aria-label="Learning overview">
      <div><span>Lessons completed</span><strong>{data.completedLessons}<small> / {data.totalLessons}</small></strong></div>
      <div><span>Questions solved</span><strong>{data.solvedQuestions}</strong></div>
      <div><span>Saved for later</span><strong>{data.bookmarkedItems}</strong></div>
      <div><span>Learning progress</span><strong>{data.lessonPercent}<small>%</small></strong></div>
    </section>}
    <section className="content-section"><div className="section-heading"><div><h2>Continue learning</h2><p>Short lessons with an example to try as you go.</p></div><Link to="/lessons" className="text-link">All lessons <ArrowRight size={15} /></Link></div>
      {busy ? <LoadingState label="Loading lessons…" /> : lessons.length ? <div className="learning-list">{lessons.slice(0, 5).map((lesson) => <ContentRow item={lesson} key={lesson._id} />)}</div> : <EmptyState title="Your lesson library is ready to fill" text="Check that the API is connected and its starter curriculum has loaded." action="Browse languages" to="/languages" />}
    </section>
    {data?.recentSubmissions?.length > 0 && <section className="content-section"><div className="section-heading"><div><h2>Recent practice</h2><p>Your latest question attempts.</p></div><Link to="/submissions" className="text-link">Submission history <ArrowRight size={15} /></Link></div><SubmissionTable submissions={data.recentSubmissions} /></section>}
  </>;
}

/*
 * ============================================================
 * Function Name : LibraryPage
 * Description   : Searches published languages, lessons, notes, or questions.
 * Input         : Content kind inferred from the current route.
 * Output        : Filterable curriculum list with working detail links.
 * Author        : Your Name
 * Date           : 23/11/2026
 * ============================================================
 */
export function LibraryPage({ kind }) {
  const titles = { language: "Programming languages", topic: "Topics", lesson: "Lessons", note: "Learning notes", question: "Code practice" };
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState(() => searchParams.get("language") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.get("/content", { params: { kind, limit: 100, ...(language ? { language } : {}) } })
      .then(({ data }) => { if (active) setItems(data.items); })
      .catch((requestError) => { if (active) setError(messageFromError(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, language]);
  const visibleItems = useMemo(() => items.filter((item) => `${item.title} ${item.description} ${item.language}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  const linkFor = (item) => item.kind === "question" ? `/practice/${item._id}` : `/learn/${item._id}`;
  const itemLink = (item) => item.kind === "language" || item.kind === "topic" ? `/lessons?language=${item.language}` : linkFor(item);
  return <>
    <div className="page-heading"><div><p className="page-kicker">LEARNING LIBRARY</p><h1>{titles[kind]}</h1><p>Choose a language and move through the material at your own pace.</p></div></div>
    <div className="library-controls"><label className="search-field"><Search size={16} /><input aria-label="Search content" placeholder="Search this library" value={search} onChange={(event) => setSearch(event.target.value)} /></label>{kind !== "language" && <label className="filter-select"><span>Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">All languages</option>{Object.entries(languageNames).map(([key, name]) => <option value={key} key={key}>{name}</option>)}</select></label>}</div>
    {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
    {loading ? <LoadingState label="Loading learning material…" /> : visibleItems.length ? <div className="learning-list">{visibleItems.map((item) => <Link className="content-row" to={itemLink(item)} key={item._id}><div className="row-icon">{item.kind === "language" ? <Code2 size={18} /> : item.kind === "question" ? <Terminal size={18} /> : item.kind === "note" ? <FileText size={18} /> : <BookOpen size={18} />}</div><div className="row-copy"><div className="row-title-line"><strong>{item.title}</strong><span className="type-tag">{item.kind}</span></div><p>{item.description}</p></div><div className="row-meta"><span>{languageNames[item.language] || "CODEMASTER"}</span>{item.kind === "question" && <span className={`difficulty ${item.difficulty}`}>{item.difficulty}</span>}<ArrowRight size={16} /></div></Link>)}</div> : <EmptyState title="No matching content yet" text={search ? "Try a shorter search or choose another language." : "Published content will appear here as it is added."} action="Clear search" onClick={() => { setSearch(""); setLanguage(""); }} />}
  </>;
}

/*
 * ============================================================
 * Function Name : LearningDetailPage
 * Description   : Reads a lesson or note and saves progress and bookmarks.
 * Input         : Content ID from the route.
 * Output        : Readable content with completion and save controls.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function LearningDetailPage() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedItemId, setLoadedItemId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    api.get(`/content/${itemId}`).then(async ({ data }) => {
      if (!active) return;
      setItem(data.item);
      setLoadedItemId(itemId);
      if (["lesson", "note"].includes(data.item.kind)) {
        api.put(`/learning/progress/${data.item._id}`, {}).catch(() => {});
      }
      const [bookmarkResult, progressResult] = await Promise.all([
        api.get("/learning/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
        api.get("/learning/overview").catch(() => ({ data: { overview: {} } })),
      ]);
      if (active) {
        setSaved(bookmarkResult.data.bookmarks.some((record) => record.item?._id === data.item._id));
        setCompleted(progressResult.data.overview.completedItems?.includes?.(data.item._id) || false);
      }
    }).catch((requestError) => { if (active) { setItem(null); setError(messageFromError(requestError)); setLoadedItemId(itemId); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [itemId]);

  const toggleSaved = async () => {
    try { const { data } = await api.put(`/learning/bookmarks/${itemId}`, { saved: !saved }); setSaved(data.saved); setNotice(data.saved ? "Saved to your bookmarks." : "Removed from your bookmarks."); }
    catch (requestError) { setError(messageFromError(requestError)); }
  };
  const toggleCompleted = async () => {
    try { await api.put(`/learning/progress/${itemId}`, { completed: !completed }); setCompleted(!completed); setNotice(!completed ? "Lesson marked complete." : "Completion status cleared."); }
    catch (requestError) { setError(messageFromError(requestError)); }
  };
  if (loading || loadedItemId !== itemId) return <LoadingState label="Opening learning material…" />;
  if (error && !item) return <InlineError message={error} />;
  if (!item) return <EmptyState title="This learning item is unavailable" text="It may have been removed or unpublished." action="Return to lessons" to="/lessons" />;
  return <>
    <Link className="back-link" to={item.kind === "note" ? "/notes" : "/lessons"}><ArrowLeft size={15} /> Back to {item.kind === "note" ? "notes" : "lessons"}</Link>
    <article className="reading-page">
      <div className="reading-topline"><span className="type-tag">{item.kind}</span><span>{languageNames[item.language] || "General"}</span></div>
      <h1>{item.title}</h1><p className="reading-description">{item.description}</p>
      {notice && <div className="inline-alert success-alert" role="status">{notice}</div>}{error && <div className="inline-alert error-alert" role="alert">{error}</div>}
      <div className="reading-body">{item.body.split("\n").map((line, index) => line.trim() ? <p key={`${index}-${line.slice(0, 10)}`}>{line}</p> : <div className="reading-gap" key={`gap-${index}`} />)}</div>
      {item.examples?.map((example, index) => <section className="example-block" key={`${example.title}-${index}`}><h2>{example.title || "Example"}</h2>{example.explanation && <p>{example.explanation}</p>}<div className="example-io"><div><span>INPUT</span><pre>{example.input}</pre></div><div><span>OUTPUT</span><pre>{example.output}</pre></div></div></section>)}
      <div className="reading-actions"><button className="secondary-button" onClick={toggleSaved}><Bookmark size={15} />{saved ? "Saved" : "Save for later"}</button><button className={completed ? "secondary-button completed-button" : "primary-cta"} onClick={toggleCompleted}>{completed ? <Check size={15} /> : <Check size={15} />}{completed ? "Completed" : "Mark complete"}</button></div>
      {item.kind === "lesson" && <Link className="next-practice-link" to="/practice">Ready to try a question? <ArrowRight size={15} /></Link>}
    </article>
  </>;
}

/*
 * ============================================================
 * Function Name : PracticePage
 * Description   : Edits and submits a solution for a published question.
 * Input         : Optional question ID from the route.
 * Output        : Problem statement, code editor, and execution verdict.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function PracticeCoachDiagram({ response }) {
  if (!response) return null;
  const nodes = response.type === "hint"
    ? [
        { kind: "input", label: "QUESTION", title: "Understand the goal", detail: "Identify what the program must produce." },
        { kind: "process", label: "HINT", title: "One idea to try", detail: response.message },
        ...(response.nextStep ? [{ kind: "output", label: "YOUR TURN", title: "Try this next", detail: response.nextStep }] : []),
      ]
    : response.type === "explain"
      ? (response.steps?.length ? response.steps.map((step, index) => ({ kind: "process", label: step.line ? `LINE ${step.line}` : `STEP ${index + 1}`, title: step.title, detail: step.detail })) : [{ kind: "process", label: "OVERVIEW", title: "Code walkthrough", detail: response.summary }])
      : [
          { kind: "input", label: "VERDICT", title: response.verdict, detail: "Assess the current solution against the question." },
          ...(response.findings || []).map((finding) => ({ kind: finding.status === "issue" ? "decision" : finding.status === "strength" ? "input" : "process", label: finding.line ? `${finding.status.toUpperCase()} · LINE ${finding.line}` : finding.status.toUpperCase(), title: finding.title, detail: finding.detail })),
          ...(response.nextAction ? [{ kind: "output", label: "NEXT ACTION", title: "What to do next", detail: response.nextAction }] : []),
        ];
  const title = response.type === "hint" ? "Hint path" : response.type === "explain" ? "Code flow" : "Review path";
  return <figure className="practice-coach-diagram" aria-label={`${title} diagram`}>
    <figcaption><GitBranch size={13} aria-hidden="true" />{title}</figcaption>
    <ol className="ai-flow-list">{nodes.map((node, index) => <li className="ai-flow-item" key={`${node.label}-${index}`}>
      <div className={`ai-flow-node ${node.kind === "input" ? "ai-flow-input" : node.kind === "decision" ? "ai-flow-decision practice-coach-flow-issue" : node.kind === "output" ? "ai-flow-output" : ""}`}>
        <div className="ai-flow-node-meta"><span>{node.label}</span><span>{String(index + 1).padStart(2, "0")}</span></div>
        <strong>{node.title}</strong><p>{node.detail}</p>
      </div>
      {index < nodes.length - 1 && <span className="ai-flow-connector" aria-hidden="true" />}
    </li>)}</ol>
  </figure>;
}

export function PracticePage() {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedId = itemId || searchParams.get("id");
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [sourceCode, setSourceCode] = useState(starterCode.javascript);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiCoachResponse, setAiCoachResponse] = useState(null);
  const [aiMode, setAiMode] = useState("");
  const [aiHintLevel, setAiHintLevel] = useState(0);
  const [aiError, setAiError] = useState("");
  const [aiProviderConfigured, setAiProviderConfigured] = useState(null);
  const [practiceTopic, setPracticeTopic] = useState("any");
  const [practiceDifficulty, setPracticeDifficulty] = useState("easy");
  const [questionProviderConfigured, setQuestionProviderConfigured] = useState(null);
  const [generationBusy, setGenerationBusy] = useState(false);
  const isGeneratedQuestion = Boolean(question?._generated);
  useEffect(() => { api.get("/content", { params: { kind: "question", limit: 100 } }).then(({ data }) => setQuestions(data.items)).catch((requestError) => setError(messageFromError(requestError))); }, []);
  useEffect(() => {
    let active = true;
    const chosen = questions.find((entry) => entry._id === selectedId) || questions[0];
    if (!chosen || isGeneratedQuestion) return () => { active = false; };
    api.get(`/content/${chosen._id}`).then(({ data }) => { if (!active) return; setQuestion(data.item); setLanguage(data.item.language || "javascript"); setSourceCode(starterCode[data.item.language] || starterCode.javascript); setStdin(data.item.examples?.[0]?.input ?? ""); setResult(null); setPreviewResult(null); setAiAnswer(""); setAiCoachResponse(null); setAiMode(""); setAiHintLevel(0); setAiError(""); setAiProviderConfigured(null); setQuestionProviderConfigured(null); }).catch((requestError) => { if (active) setError(messageFromError(requestError)); });
    return () => { active = false; };
  }, [questions, selectedId, isGeneratedQuestion]);

  /*
   * ============================================================
   * Function Name : requestPracticeHelp
   * Description   : Requests a contextual hint, explanation, or code review.
   * Input         : Practice helper mode selected by the learner.
   * Output        : Provider feedback or the built-in local guide response.
   * Author        : Your Name
   * Date          : 24/11/2026
   * ============================================================
   */
  const requestPracticeHelp = async (helpMode) => {
    if (!question) return;
    if (sourceCode.length > 12000) {
      setAiAnswer(""); setAiCoachResponse(null); setAiMode(helpMode); setAiProviderConfigured(null); setAiError("AI help accepts code up to 12,000 characters. Shorten the solution and try again.");
      return;
    }
    const hintLevel = helpMode === "hint" ? aiHintLevel + 1 : 0;
    const instructions = {
      hint: `Give one progressive hint for this practice question. This is hint ${hintLevel}. Do not reveal the full solution. ${aiAnswer ? `The previous hint was: ${aiAnswer.slice(0, 350)} Give the next, slightly more specific hint.` : "Start with a conceptual hint."}`,
      explain: "Explain how the learner's current code works, step by step, using beginner-friendly language.",
      review: "Review the current code against the practice requirements. Give a verdict, likely correctness issues, edge cases, and one next action without rewriting the full solution.",
    };
    const context = [
      `Question: ${question.title}`,
      `Description: ${question.description || ""}`,
      `Requirements: ${question.body || ""}`,
      question.constraints?.length ? `Constraints: ${question.constraints.join("; ")}` : "",
      question.examples?.[0] ? `Example input: ${question.examples[0].input || ""}\nExample output: ${question.examples[0].output || ""}` : "",
      `Current program input: ${stdin || "(empty)"}`,
      previewResult ? `Latest run: ${previewResult.statusDescription}; output: ${previewResult.output || "(no output)"}${previewResult.error ? `; error: ${previewResult.error.slice(0, 250)}` : ""}` : "Latest run: not run yet.",
    ].filter(Boolean).join("\n").slice(0, 1100);
    setAiBusy(helpMode); setAiMode(helpMode); setAiHintLevel(hintLevel); setAiError(""); setAiAnswer(""); setAiCoachResponse(null); setAiProviderConfigured(null);
    try {
      const { data } = await api.post("/ai/help", {
        mode: `practice_${helpMode}`,
        language,
        prompt: `${instructions[helpMode]}\n\n${context}`.slice(0, 1500),
        code: sourceCode,
        stdin,
      }, { timeout: 25000 });
      const coach = data.coach || (helpMode === "hint"
        ? { type: "hint", message: String(data.answer || "Use the sample input to trace the next step."), nextStep: "Try the idea in your editor." }
        : helpMode === "explain"
          ? { type: "explain", summary: String(data.answer || "Here is a walkthrough of the current code."), steps: [], takeaway: "Compare the explanation with the problem example." }
          : { type: "review", verdict: "Review complete", findings: [{ status: "check", title: "Coach feedback", detail: String(data.answer || "Run your solution against the example and edge cases.") }], nextAction: "Verify the solution with the example input." });
      setAiCoachResponse(coach);
      setAiAnswer(coach.message || coach.summary || coach.findings?.map((finding) => finding.detail).join(" ") || "");
      setAiProviderConfigured(data.providerConfigured);
    } catch (requestError) { setAiError(messageFromError(requestError)); }
    finally { setAiBusy(""); }
  };

  /*
   * ============================================================
   * Function Name : generatePracticeQuestion
   * Description   : Requests a challenge for the learner's preferences.
   * Input         : Current language, topic, and difficulty selections.
   * Output        : Temporary question with a matching sample input.
   * Author        : Your Name
   * Date          : 24/11/2026
   * ============================================================
   */
  const generatePracticeQuestion = async () => {
    setGenerationBusy(true); setError(""); setQuestionProviderConfigured(null); setAiAnswer(""); setAiCoachResponse(null); setAiMode(""); setAiHintLevel(0); setAiError("");
    try {
      const { data } = await api.post("/ai/practice-question", { language, topic: practiceTopic, difficulty: practiceDifficulty }, { timeout: 25000 });
      setQuestion({ ...data.question, _generated: true });
      setQuestionProviderConfigured(data.providerConfigured);
      setSourceCode(starterCode[language] || starterCode.javascript);
      setStdin(data.question.examples?.[0]?.input || "");
      setResult(null); setPreviewResult(null); setAiProviderConfigured(null);
    } catch (requestError) { setError(messageFromError(requestError)); }
    finally { setGenerationBusy(false); }
  };

  const handleRunWithInput = async () => {
    if (!question) return;
    setBusy(true); setError(""); setResult(null); setPreviewResult(null); setAiAnswer(""); setAiCoachResponse(null); setAiError(""); setAiProviderConfigured(null);
    try { const endpoint = question._generated ? "/execution/run" : `/execution/${question._id}/run`; const { data } = await api.post(endpoint, { language, sourceCode, stdin }, { timeout: 45000 }); setPreviewResult(data.result); }
    catch (requestError) { setError(messageFromError(requestError)); }
    finally { setBusy(false); }
  };

  /*
   * ============================================================
   * Function Name : handleSubmitCode
   * Description   : Sends source to the isolated execution API.
   * Input         : Form submit event.
   * Output        : Verdict panel or a runner setup/error message.
   * Author        : Your Name
   * Date          : 23/11/2026
   * ============================================================
   */
  const handleSubmitCode = async (event) => {
    event.preventDefault();
    if (!question) return;
    if (question._generated) { await requestPracticeHelp("review"); return; }
    setBusy(true); setError(""); setResult(null); setPreviewResult(null);
    try { const { data } = await api.post(`/execution/${question._id}`, { language, sourceCode }, { timeout: 120000 }); setResult(data.submission); }
    catch (requestError) { setError(messageFromError(requestError)); }
    finally { setBusy(false); }
  };
  const changeQuestion = (id) => { setQuestion(null); setQuestionProviderConfigured(null); navigate(`/practice/${id}`, { replace: true }); };
  return <>
    <div className="page-heading compact-heading"><div><p className="page-kicker">CODE PRACTICE</p><h1>Practice with fresh questions.</h1><p>Generate a challenge for your language and level, solve it in the editor, and get feedback.</p></div></div>
    <section className="practice-generator" aria-labelledby="practice-generator-title">
      <div className="practice-generator-copy"><span className="practice-generator-icon"><Sparkles size={16} /></span><div><h2 id="practice-generator-title">AI question practice</h2><p>Choose what to practice, then generate a new coding challenge.</p></div>{questionProviderConfigured != null && <span className={`ai-provider-badge ${questionProviderConfigured ? "ai-provider-connected" : ""}`}>{questionProviderConfigured ? "AI generated" : "Built-in question"}</span>}</div>
      <div className="practice-generator-controls"><label>Topic<select value={practiceTopic} onChange={(event) => setPracticeTopic(event.target.value)}><option value="any">Any topic</option><option value="input_output">Input and output</option><option value="conditions">Conditions</option><option value="loops">Loops</option><option value="arrays">Arrays</option><option value="strings">Strings</option></select></label><label>Difficulty<select value={practiceDifficulty} onChange={(event) => setPracticeDifficulty(event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><button className="primary-cta" disabled={generationBusy || Boolean(aiBusy)} onClick={generatePracticeQuestion} type="button"><Sparkles size={15} />{generationBusy ? "Generating…" : "Generate question"}</button></div>
      <p className="practice-generator-note">Questions are temporary and aren’t added to your submission history. {questionProviderConfigured === false ? "The built-in question library is foundational and may not match the selected difficulty; connect an AI provider for difficulty-calibrated questions." : ""}</p>
    </section>
    <div className="practice-layout">
      <aside className="problem-panel">
        <label className="question-select">Choose a question<select value={question?._generated ? "generated" : question?._id || ""} onChange={(event) => { if (event.target.value !== "generated") changeQuestion(event.target.value); }}>{question?._generated && <option value="generated">New challenge · {question.title}</option>}{questions.map((entry) => <option value={entry._id} key={entry._id}>{languageNames[entry.language]} · {entry.title}</option>)}</select></label>
        {question ? <><div className="problem-meta"><span className={`difficulty ${question.difficulty}`}>{question.difficulty}</span><span>{languageNames[question.language]}</span>{question._generated && <span className="type-tag">Temporary</span>}</div><h2>{question.title}</h2><p>{question.description}</p><div className="problem-body">{question.body}</div>{question.constraints?.length > 0 && <><h3>Constraints</h3><ul>{question.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></>}{question.examples?.map((example, index) => <div className="example-block" key={index}><h3>{example.title || "Example"}</h3><div className="example-io"><div><span>INPUT</span><pre>{example.input}</pre></div><div><span>OUTPUT</span><pre>{example.output}</pre></div></div>{example.explanation && <p>{example.explanation}</p>}</div>)}<details className="hint-disclosure"><summary>Show a hint</summary><ol>{question.hints?.map((hint) => <li key={hint}>{hint}</li>)}</ol></details></> : <EmptyState title="No practice questions yet" text="Generate an AI practice question or choose a published question." action="Browse lessons" to="/lessons" />}
      </aside>
      <section className="editor-panel">
        <div className="editor-toolbar"><label>Language<select value={language} onChange={(event) => { setLanguage(event.target.value); setSourceCode(starterCode[event.target.value]); if (question?._generated) setQuestion((current) => ({ ...current, language: event.target.value })); setAiAnswer(""); setAiCoachResponse(null); setAiMode(""); setAiHintLevel(0); setAiError(""); setAiProviderConfigured(null); }} >{Object.entries(languageNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><span><span className="status-dot" /> LOCAL EDITOR</span></div>
        <form onSubmit={handleSubmitCode}><label className="visually-hidden" htmlFor="code-source">Solution source code</label><textarea className="code-editor" id="code-source" spellCheck="false" value={sourceCode} onChange={(event) => { setSourceCode(event.target.value); setPreviewResult(null); setResult(null); setAiAnswer(""); setAiCoachResponse(null); setAiMode(""); setAiHintLevel(0); setAiError(""); setAiProviderConfigured(null); }} placeholder="Write your solution here…" /><div className="program-input"><label htmlFor="program-stdin">Program input <span>(stdin)</span></label><textarea id="program-stdin" value={stdin} onChange={(event) => { setStdin(event.target.value); setPreviewResult(null); setAiAnswer(""); setAiCoachResponse(null); setAiMode(""); setAiError(""); setAiProviderConfigured(null); }} maxLength={20000} rows={4} placeholder="Enter the values your program should read. Example: 2 3" /></div><div className="editor-footer"><span>{sourceCode.split("\n").length} lines · {sourceCode.length} characters</span><div className="run-actions"><button className="secondary-run-button" disabled={busy || !question || !sourceCode.trim()} onClick={handleRunWithInput} type="button"><Play size={13} />{busy ? "Running…" : "Run with input"}</button><button className="primary-cta run-button" disabled={busy || Boolean(aiBusy) || !question || !sourceCode.trim()} type="submit"><Play size={14} />{busy ? "Running…" : aiBusy === "review" && question?._generated ? "Reviewing…" : question?._generated ? "Get AI feedback" : "Submit solution"}</button></div></div></form>
        {error && <div className="inline-alert error-alert" role="alert">{error}{error.includes("not available") && <span> Your code stays in the editor; no code runs on this web server.</span>}</div>}
        {previewResult && <div className={`submission-result ${previewResult.status === "accepted" ? "result-accepted" : "result-failed"}`} role="status"><div><strong>{previewResult.status.replaceAll("_", " ")}</strong><span>{previewResult.statusDescription}{previewResult.runtimeMs != null ? ` · ${previewResult.runtimeMs} ms` : ""}</span></div>{previewResult.error && <pre>{previewResult.error}</pre>}<div className="program-output"><span>PROGRAM OUTPUT</span><pre>{previewResult.output || "(no output)"}</pre></div></div>}
        {result && <div className={`submission-result ${result.status === "accepted" ? "result-accepted" : "result-failed"}`} role="status"><div><strong>{result.status.replaceAll("_", " ")}</strong><span>{result.passedTests} / {result.totalTests} tests passed{result.runtimeMs != null ? ` · ${result.runtimeMs} ms` : ""}</span></div>{result.error && <pre>{result.error}</pre>}{result.output && <details><summary>Program output</summary><pre>{result.output}</pre></details>}</div>}
        <p className="runner-note">Run with input uses the isolated Judge0 service. Published questions are graded against hidden tests; temporary questions get AI feedback and aren’t stored as submissions.</p>
        <section className="practice-ai-panel" aria-labelledby="practice-ai-title">
          <div className="practice-ai-heading">
            <div><div className="practice-ai-title-row"><Sparkles size={15} /><h2 id="practice-ai-title">AI practice coach</h2></div><p>Get a progressive hint, understand your code, or review it against the question.</p></div>
            <span className={aiProviderConfigured ? "ai-provider-badge ai-provider-connected" : "ai-provider-badge"}>{aiProviderConfigured == null ? "Ready to help" : aiProviderConfigured ? "AI provider" : "Built-in guide"}</span>
          </div>
          <div className="practice-ai-actions" aria-label="Practice help actions">
            <button className="secondary-run-button" disabled={Boolean(aiBusy) || !question} onClick={() => requestPracticeHelp("hint")} type="button"><CircleHelp size={14} />{aiBusy === "hint" ? "Thinking…" : aiHintLevel > 0 ? "Give next hint" : "Give me a hint"}</button>
            <button className="secondary-run-button" disabled={Boolean(aiBusy) || !question} onClick={() => requestPracticeHelp("explain")} type="button"><BookOpen size={14} />{aiBusy === "explain" ? "Explaining…" : "Explain my code"}</button>
            <button className="secondary-run-button" disabled={Boolean(aiBusy) || !question} onClick={() => requestPracticeHelp("review")} type="button"><Check size={14} />{aiBusy === "review" ? "Reviewing…" : "Review my solution"}</button>
          </div>
          {aiError && <div className="inline-alert error-alert practice-ai-error" role="alert">{aiError}<button className="practice-ai-retry" disabled={Boolean(aiBusy)} onClick={() => requestPracticeHelp(aiMode || "review")} type="button">Try again</button></div>}
          {aiBusy && <section className="practice-ai-response practice-coach-loading" aria-label="Preparing practice feedback" aria-live="polite">
            <div className="practice-ai-response-heading"><strong>{aiBusy === "hint" ? "Preparing your next hint" : aiBusy === "explain" ? "Building a code walkthrough" : "Reviewing your solution"}</strong><span>PLEASE WAIT</span></div>
            <span /><span /><span />
          </section>}
          {aiCoachResponse && !aiBusy && <section className={`practice-ai-response practice-coach-${aiCoachResponse.type}`} aria-label="AI practice feedback" aria-live="polite">
            <div className="practice-ai-response-heading"><strong>{aiMode === "hint" ? `Hint ${aiHintLevel}` : aiMode === "review" ? "Code review" : "Code walkthrough"}</strong><span>{aiProviderConfigured ? "AI COACH" : "BUILT-IN GUIDE"}</span></div>
            <PracticeCoachDiagram response={aiCoachResponse} />
            {aiCoachResponse.type === "hint" && <div className="practice-coach-hint">
              <p>{aiCoachResponse.message}</p>
              {aiCoachResponse.nextStep && <div className="practice-coach-next"><span>TRY THIS</span><p>{aiCoachResponse.nextStep}</p></div>}
            </div>}
            {aiCoachResponse.type === "explain" && <div className="practice-coach-body">
              <p className="practice-coach-summary">{aiCoachResponse.summary}</p>
              {aiCoachResponse.steps?.length > 0 && <ol className="practice-coach-steps">{aiCoachResponse.steps.map((step, index) => <li className="practice-coach-step" key={`${step.line || index}-${index}`}><span className="practice-coach-step-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}{step.line ? <span className="practice-coach-line">LINE {step.line}</span> : null}</strong><p>{step.detail}</p></div></li>)}</ol>}
              {aiCoachResponse.takeaway && <div className="practice-coach-next"><span>KEY TAKEAWAY</span><p>{aiCoachResponse.takeaway}</p></div>}
            </div>}
            {aiCoachResponse.type === "review" && <div className="practice-coach-body">
              <span className={`practice-coach-verdict ${aiCoachResponse.verdict === "Looks on track" ? "is-positive" : aiCoachResponse.verdict === "Needs revision" ? "is-warning" : ""}`}>{aiCoachResponse.verdict}</span>
              {aiCoachResponse.findings?.length > 0 && <ul className="practice-coach-findings">{aiCoachResponse.findings.map((finding, index) => <li className={`practice-coach-finding is-${finding.status}`} key={`${finding.title}-${index}`}><span className="practice-coach-finding-marker" aria-hidden="true">{finding.status === "issue" ? "!" : finding.status === "strength" ? "✓" : "·"}</span><div><strong>{finding.title}{finding.line ? <span className="practice-coach-line">LINE {finding.line}</span> : null}</strong><p>{finding.detail}</p></div></li>)}</ul>}
              {aiCoachResponse.nextAction && <div className="practice-coach-next"><span>NEXT STEP</span><p>{aiCoachResponse.nextAction}</p></div>}
              <p className="practice-ai-context">Review uses the selected problem, current code, program input, and latest run result when available.</p>
            </div>}
          </section>}
          <p className="practice-ai-note">Hints avoid giving away the full solution. Review feedback is guidance; verify behavior with Run with input and the question grader.</p>
        </section>
      </section>
    </div>
  </>;
}

/*
 * ============================================================
 * Function Name : AssistantPage
 * Description   : Sends questions or code to the optional learning helper.
 * Input         : None.
 * Output        : Tutor, explanation, or analysis form and response.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function AssistantPage() {
  const [mode, setMode] = useState("tutor");
  const [language, setLanguage] = useState("javascript");
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setAnswer("");
    try { const { data } = await api.post("/ai/help", { mode, language, prompt, code }); setAnswer(data.answer); }
    catch (requestError) { setError(messageFromError(requestError)); }
    finally { setBusy(false); }
  };
  return <>
    <div className="page-heading"><div><p className="page-kicker">LEARNING TOOLS</p><h1>Ask about your code.</h1><p>Get a guided explanation or a basic local review of your program.</p></div></div>
    <form className="assistant-form" onSubmit={send}>
      <div className="assistant-controls"><label>Tool<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="tutor">Code tutor</option><option value="explain">Explain code</option><option value="analyze">Analyze code</option></select></label><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}>{Object.entries(languageNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label></div>
      <label>Your question<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1500} placeholder="For example: Why does this loop stop after four iterations?" rows={3} /></label>
      <label>Code to discuss <span className="optional-label">optional</span><textarea className="assistant-code" value={code} onChange={(event) => setCode(event.target.value)} maxLength={12000} placeholder="Paste a short code sample" rows={8} /></label>
      {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
      <button className="primary-cta" type="submit" disabled={busy || (!prompt.trim() && !code.trim())}>{busy ? "Preparing guidance…" : mode === "analyze" ? "Review code" : "Get an explanation"}<ArrowRight size={15} /></button>
    </form>
    {answer && <section className="answer-panel"><div className="section-heading"><div><h2>{mode === "analyze" ? "Code review" : "Learning guidance"}</h2><p>Use this as a starting point and check the reasoning against your program.</p></div></div><div className="answer-copy">{answer.split("\n").map((line, index) => line ? <p key={`${index}-${line.slice(0, 12)}`}>{line}</p> : <br key={index} />)}</div></section>}
  </>;
}

/*
 * ============================================================
 * Function Name : DryRunPage
 * Description   : Runs supported languages and requests AI dry-run explanations.
 * Input         : Language, source code, and standard input.
 * Output        : Isolated program output or ordered JavaScript trace steps.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function DryRunPage() {
  const [language, setLanguage] = useState("javascript");
  const [questionId, setQuestionId] = useState("");
  const [source, setSource] = useState("const width = 4;\nconst height = 3;\nconst area = width * height;\nconsole.log(area);");
  const [stdin, setStdin] = useState("");
  const [steps, setSteps] = useState([]);
  const [runResult, setRunResult] = useState(null);
  const [optimizations, setOptimizations] = useState(null);
  const [activeView, setActiveView] = useState("flowchart");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiDryRun, setAiDryRun] = useState(null);
  const [aiDryRunError, setAiDryRunError] = useState("");
  const [aiDryRunBusy, setAiDryRunBusy] = useState(false);

  useEffect(() => {
    let current = true;
    api.get("/content", { params: { kind: "question", language, limit: 1 } })
      .then(({ data }) => { if (current) setQuestionId(data.items?.[0]?._id || ""); })
      .catch((requestError) => { if (current) setError(messageFromError(requestError)); });
    return () => { current = false; };
  }, [language]);

  const changeLanguage = (nextLanguage) => {
    setQuestionId("");
    setLanguage(nextLanguage);
    setSource(nextLanguage === "javascript" ? "const width = 4;\nconst height = 3;\nconst area = width * height;\nconsole.log(area);" : starterCode[nextLanguage]);
    setSteps([]); setRunResult(null); setOptimizations(null); setAiDryRun(null); setAiDryRunError(""); setActiveView("flowchart"); setError("");
  };

  const trace = () => {
    setError(""); setRunResult(null); setActiveView("flowchart");
    try { setSteps(dryRunJavaScript(source)); }
    catch (traceError) { setSteps([]); setError(traceError.message); }
  };
  const analyzeOptimizations = () => {
    setError(""); setOptimizations(optimizeCode(source, language)); setActiveView("optimizations");
  };
  const applyOptimization = (suggestion) => {
    const lines = source.split("\n");
    lines[suggestion.line - 1] = suggestion.after;
    const optimizedSource = lines.join("\n");
    setSource(optimizedSource); setOptimizations(optimizeCode(optimizedSource, language)); setSteps([]); setRunResult(null); setAiDryRun(null); setAiDryRunError(""); setActiveView("optimizations");
  };
  const requestAiDryRun = async ({ showFlowchart = false } = {}) => {
    if (!source.trim()) return setAiDryRunError("Add some code before requesting an AI dry run.");
    if (source.length > 12000) return setAiDryRunError("AI dry run supports source code up to 12,000 characters. Shorten the code and try again.");
    setAiDryRunBusy(true); setAiDryRunError(""); setAiDryRun(null);
    try {
      const { data } = await api.post("/ai/help", {
        mode: "dry_run",
        language,
        prompt: "Simulate this program step by step using the exact provided standard input.",
        code: source,
        stdin,
      }, { timeout: 30000 });
      setAiDryRun({ answer: data.answer, uncertainty: data.uncertainty || "", diagram: data.diagram || null, providerConfigured: data.providerConfigured });
      if (showFlowchart) setActiveView("flowchart");
    } catch (requestError) {
      setAiDryRunError(messageFromError(requestError));
    } finally {
      setAiDryRunBusy(false);
    }
  };
  const runWithInput = async () => {
    if (!questionId) return setError(`No published ${languageNames[language]} practice question is available to run this code.`);
    setBusy(true); setError(""); setSteps([]); setRunResult(null); setActiveView("output");
    try {
      const { data } = await api.post(`/execution/${questionId}/run`, { language, sourceCode: source, stdin }, { timeout: 45000 });
      setRunResult(data.result);
    } catch (requestError) { setError(messageFromError(requestError)); }
    finally { setBusy(false); }
  };
  return <>
    <div className="page-heading"><div><p className="page-kicker">CODE VISUALIZATION</p><h1>Follow the program.</h1><p>Run C, C++, Java, and JavaScript with input. JavaScript also supports a step-by-step trace.</p></div></div>
    <div className="dry-run-layout"><section className="editor-panel dry-run-editor"><div className="editor-toolbar"><label>Language<select aria-label="Dry run language" value={language} onChange={(event) => changeLanguage(event.target.value)}>{Object.entries(languageNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><span><span className="status-dot" /> ISOLATED RUNNER</span></div><label className="visually-hidden" htmlFor="dry-run-source">{languageNames[language]} source code</label><textarea id="dry-run-source" className="code-editor" value={source} onChange={(event) => { setSource(event.target.value); setSteps([]); setRunResult(null); setOptimizations(null); setAiDryRun(null); setAiDryRunError(""); }} spellCheck="false" /><div className="program-input dry-run-input"><label htmlFor="dry-run-stdin">Program input <span>(stdin)</span></label><textarea id="dry-run-stdin" value={stdin} onChange={(event) => { setStdin(event.target.value); setRunResult(null); setAiDryRun(null); setAiDryRunError(""); }} maxLength={20000} rows={4} placeholder="Enter the values your program should read. Example: 2 3" /></div><div className="editor-footer"><span>{language === "javascript" ? "Trace simple JavaScript or run it with input" : `Run ${languageNames[language]} in the isolated sandbox`}</span><div className="run-actions">{language === "javascript" && <button className="secondary-run-button" onClick={trace} type="button"><GitBranch size={13} />Trace steps</button>}<button className="primary-cta run-button" onClick={runWithInput} disabled={busy || !source.trim() || !questionId} type="button"><Play size={14} />{busy ? "Running…" : "Run with input"}</button></div></div></section>
      <section className="trace-panel"><div className="section-heading"><div><h2>Code insights</h2><p>See the execution path, ask AI to trace values, or review safe optimization suggestions.</p></div></div><div className="visualization-tabs" role="tablist" aria-label="Code insight views"><button className={activeView === "flowchart" ? "visualization-tab active" : "visualization-tab"} onClick={() => setActiveView("flowchart")} role="tab" aria-selected={activeView === "flowchart"} type="button">Flowchart</button><button className={activeView === "ai-dry-run" ? "visualization-tab active" : "visualization-tab"} onClick={() => setActiveView("ai-dry-run")} role="tab" aria-selected={activeView === "ai-dry-run"} type="button"><Sparkles size={12} />AI dry run</button><button className={activeView === "optimizations" ? "visualization-tab active" : "visualization-tab"} onClick={() => setActiveView("optimizations")} role="tab" aria-selected={activeView === "optimizations"} type="button">Optimizations{optimizations?.length ? <span>{optimizations.length}</span> : null}</button><button className={activeView === "output" ? "visualization-tab active" : "visualization-tab"} onClick={() => setActiveView("output")} role="tab" aria-selected={activeView === "output"} type="button">Run output</button></div>{error && <div className="inline-alert error-alert" role="alert">{error}</div>}
        {activeView === "flowchart" && !aiDryRun?.diagram && <><p className="flowchart-caption">{steps.length ? "JavaScript statement trace" : runResult ? "Program execution stages" : "Run or trace your code to build its flowchart."}</p>{steps.length ? <ol className="flowchart" aria-label="JavaScript program flowchart"><li><div className="flowchart-node flowchart-terminal"><span>START</span><strong>Begin program</strong></div></li>{steps.map((step, index) => <li key={`${step.line}-${index}`}><div className={step.output ? "flowchart-node flowchart-output" : "flowchart-node flowchart-process"}><span>LINE {step.line}</span><strong>{step.code}</strong><small>{step.action}</small></div></li>)}<li><div className="flowchart-node flowchart-terminal"><span>END</span><strong>Program complete</strong></div></li></ol> : runResult ? <ol className="flowchart" aria-label="Program execution stages"><li><div className="flowchart-node flowchart-terminal"><span>START</span><strong>Begin run</strong></div></li><li><div className="flowchart-node flowchart-process"><span>{language === "javascript" ? "RUNTIME" : "COMPILE + RUN"}</span><strong>Prepare {languageNames[language]} program</strong></div></li><li><div className="flowchart-node flowchart-input"><span>INPUT</span><strong>Read standard input</strong></div></li><li><div className="flowchart-node flowchart-process"><span>EXECUTION</span><strong>Run source code in Judge0</strong></div></li><li><div className="flowchart-node flowchart-output"><span>OUTPUT</span><strong>{runResult.status === "accepted" ? "Return program output" : runResult.statusDescription}</strong></div></li><li><div className="flowchart-node flowchart-terminal"><span>END</span><strong>Finish run</strong></div></li></ol> : <div className="trace-empty"><GitBranch size={20} /><p>{language === "javascript" ? "Use Trace steps for a quick local chart, or build a deeper AI trace." : "Generate an AI flowchart for " + languageNames[language] + " using the exact source and input."}</p><button className="secondary-run-button" onClick={() => requestAiDryRun({ showFlowchart: true })} disabled={aiDryRunBusy || !source.trim()} type="button">{aiDryRunBusy ? "Building AI flowchart…" : "Generate AI flowchart"}</button></div>}<p className="runner-note">Line-by-line charts reflect the JavaScript statements supported by the tracer. Other languages show the runner stages.</p></>}
        {activeView === "flowchart" && language !== "javascript" && runResult && !aiDryRun?.diagram && <button className="secondary-run-button" onClick={() => requestAiDryRun({ showFlowchart: true })} disabled={aiDryRunBusy || !source.trim()} type="button">{aiDryRunBusy ? "Building AI flowchart…" : "Generate AI flowchart"}</button>}{activeView === "flowchart" && aiDryRun?.diagram && <section className="ai-flowchart-result" aria-label="AI generated program flowchart"><p className="flowchart-caption">AI generated {languageNames[language]} execution path</p>{aiDryRun.uncertainty && <div className="ai-trace-uncertainty" role="note">{aiDryRun.uncertainty}</div>}<AiDryRunDiagram diagram={aiDryRun.diagram} /></section>}{activeView === "flowchart" && !aiDryRun?.diagram && aiDryRunError && <div className="inline-alert error-alert" role="alert">{aiDryRunError}</div>}{activeView === "flowchart" && !aiDryRun?.diagram && aiDryRun && !aiDryRun.providerConfigured && <div className="inline-alert error-alert" role="alert">{aiDryRun.answer}</div>}{activeView === "ai-dry-run" && <section className="ai-dry-run-view" role="tabpanel" aria-label="AI dry run"><div className="ai-dry-run-heading"><div><h3><Sparkles size={15} />AI dry run</h3><p>Trace the selected language with your exact source and stdin. Inspect each step, branch, variable value, and predicted output.</p></div><span className={`ai-provider-badge ${aiDryRun?.providerConfigured ? "configured" : ""}`}>{aiDryRun ? (aiDryRun.providerConfigured ? "AI provider ready" : "Provider required") : "AI assisted"}</span></div><button className="primary-cta ai-dry-run-button" onClick={requestAiDryRun} disabled={aiDryRunBusy || !source.trim()} type="button"><Sparkles size={14} />{aiDryRunBusy ? "Tracing your code…" : aiDryRun ? "Run AI dry run again" : "Run AI dry run"}</button>{aiDryRunError && <div className="inline-alert error-alert" role="alert">{aiDryRunError}</div>}{aiDryRun ? <><div className="ai-dry-run-summary"><span>TRACE SUMMARY</span><p>{aiDryRun.answer}</p></div>{aiDryRun.uncertainty && <div className="ai-trace-uncertainty" role="note">{aiDryRun.uncertainty}</div>}{aiDryRun.diagram && <AiDryRunDiagram diagram={aiDryRun.diagram} />}{aiDryRun.diagram?.quality === "source-outline" && <div className="answer-copy ai-dry-run-fallback">{aiDryRun.answer.split("\n").map((line, index) => line ? <p key={`${index}-${line.slice(0, 12)}`}>{line}</p> : <br key={index} />)}</div>}</> : !aiDryRunError && <div className="trace-empty"><Sparkles size={20} /><p>Run AI dry run to build a visual trace. Add stdin on the left if your program reads input.</p></div>}<p className="runner-note">This diagram is an AI prediction, not a real execution. Use Run with input to verify it with the isolated runner.</p></section>}
        {activeView === "optimizations" && <div className="optimization-view">{optimizations === null ? <div className="trace-empty"><Gauge size={20} /><p>Analyze this source for safe, explainable simplifications.</p><button className="secondary-run-button" onClick={analyzeOptimizations} type="button">Find optimizations</button></div> : optimizations.length ? <div className="optimization-list">{optimizations.map((suggestion) => <article className="optimization-item" key={suggestion.id}><div className="optimization-heading"><span>LINE {suggestion.line}</span><h3>{suggestion.title}</h3></div><p>{suggestion.explanation}</p><pre>{suggestion.before}</pre><div className="optimization-replacement"><ArrowRight size={14} /><pre>{suggestion.after}</pre></div><button className="secondary-run-button" onClick={() => applyOptimization(suggestion)} type="button">Apply this change</button></article>)}</div> : <div className="trace-empty"><Check size={20} /><p>No safe, obvious simplifications were found in this source.</p><button className="secondary-run-button" onClick={analyzeOptimizations} type="button">Analyze again</button></div>}</div>}
        {activeView === "output" && (runResult ? <div className={`submission-result ${runResult.status === "accepted" ? "result-accepted" : "result-failed"}`} role="status"><div><strong>{runResult.status.replaceAll("_", " ")}</strong><span>{runResult.statusDescription}{runResult.runtimeMs != null ? ` · ${runResult.runtimeMs} ms` : ""}</span></div>{runResult.error && <pre>{runResult.error}</pre>}<div className="program-output"><span>PROGRAM OUTPUT</span><pre>{runResult.output || "(no output)"}</pre></div></div> : <div className="trace-empty"><Terminal size={20} /><p>Run the program to see its output here.</p></div>)}
        <p className="runner-note">Runs use the isolated Judge0 service. The optimizer only applies a change when you choose Apply this change.</p></section></div>
  </>;
}

function AiDryRunDiagram({ diagram }) {
  const steps = Array.isArray(diagram.steps) ? diagram.steps : [];
  const kindLabel = { input: "INPUT", decision: "DECISION", output: "OUTPUT", process: "PROCESS" };
  return <section className="ai-trace-figure" aria-label="AI predicted execution diagram">
    <div className="ai-trace-figure-heading"><div><h4>Predicted execution path</h4><p>{diagram.quality === "ai-trace" ? "AI simulated steps" : "Source statements in order"}</p></div><span><GitBranch size={12} />{steps.length} STEPS</span></div>
    <div className="ai-flow-scroll"><ol className="ai-flow-list">
      <li className="ai-flow-item"><div className="ai-flow-node ai-flow-terminal"><span>START</span><strong>Begin program</strong></div><span className="ai-flow-connector" aria-hidden="true" /></li>
      {steps.map((step, index) => <li className="ai-flow-item" key={`${step.line || "step"}-${index}`}>
        <article className={`ai-flow-node ai-flow-${step.kind || "process"}`}>
          <div className="ai-flow-node-meta"><span>{kindLabel[step.kind] || "PROCESS"}</span>{step.line ? <span>LINE {step.line}</span> : null}</div>
          <code>{step.statement}</code>
          {step.action && <p>{step.action}</p>}
          {step.outcome && <strong className="ai-flow-outcome">Path taken: {step.outcome}</strong>}
          {step.values?.length > 0 && <div className="variable-list" aria-label="Variable values">{step.values.map((entry, valueIndex) => <span key={`${entry.name}-${valueIndex}`}><code>{entry.name}</code><b>{entry.value}</b></span>)}</div>}
        </article>
        <span className="ai-flow-connector" aria-hidden="true" />
      </li>)}
      <li className="ai-flow-item"><div className="ai-flow-node ai-flow-output"><div className="ai-flow-node-meta"><span>PREDICTED STDOUT</span></div><pre>{diagram.expectedOutput || "(no output predicted)"}</pre></div><span className="ai-flow-connector" aria-hidden="true" /></li>
      <li className="ai-flow-item"><div className="ai-flow-node ai-flow-terminal"><span>END</span><strong>Trace complete</strong></div></li>
    </ol></div>
  </section>;
}

/*
 * ============================================================
 * Function Name : BookmarksPage
 * Description   : Lists saved content with one-click removal.
 * Input         : Authenticated student's bookmark API response.
 * Output        : A manageable saved-items list and empty state.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function BookmarksPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = useCallback(() => api.get("/learning/bookmarks").then(({ data }) => setItems(data.bookmarks)).catch((requestError) => setError(messageFromError(requestError))).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  const remove = async (itemId) => { try { await api.put(`/learning/bookmarks/${itemId}`, { saved: false }); setItems((current) => current.filter((entry) => entry.item?._id !== itemId)); } catch (requestError) { setError(messageFromError(requestError)); } };
  return <><div className="page-heading"><div><p className="page-kicker">YOUR LIBRARY</p><h1>Saved for later</h1><p>Keep lessons and notes close while you study.</p></div></div>{error && <InlineError message={error} />}{loading ? <LoadingState label="Loading saved items…" /> : items.length ? <div className="learning-list">{items.map(({ item }) => item && <div className="content-row" key={item._id}><Link className="row-main-link" to={`/learn/${item._id}`}><div className="row-icon"><Bookmark size={17} /></div><div className="row-copy"><strong>{item.title}</strong><p>{item.description}</p></div></Link><button className="quiet-button" onClick={() => remove(item._id)}>Remove</button></div>)}</div> : <EmptyState title="Nothing saved yet" text="Bookmark a lesson or note and it will show up here." action="Browse lessons" to="/lessons" />}</>;
}

/*
 * ============================================================
 * Function Name : SubmissionsPage
 * Description   : Shows a student's own practice attempt history.
 * Input         : Current authenticated user.
 * Output        : A private table of question verdicts and attempt dates.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/learning/submissions").then(({ data }) => setSubmissions(data.submissions)).catch((requestError) => setError(messageFromError(requestError))).finally(() => setLoading(false)); }, []);
  return <><div className="page-heading"><div><p className="page-kicker">CODE PRACTICE</p><h1>Submission history</h1><p>Review your recent solutions and verdicts.</p></div></div>{error && <InlineError message={error} />}{loading ? <LoadingState label="Loading submissions…" /> : submissions.length ? <SubmissionTable submissions={submissions} /> : <EmptyState title="No submissions yet" text="Choose a practice question and submit your first solution." action="Explore practice" to="/practice" />}</>;
}

/*
 * ============================================================
 * Function Name : AnalyticsPage
 * Description   : Visualizes the current student's saved learning outcomes.
 * Input         : Personal per-language analytics API response.
 * Output        : Language summary with completed and solved counts.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function AnalyticsPage() {
  const [rows, setRows] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/learning/analytics").then(({ data }) => setRows(Object.entries(data.byLanguage))).catch((requestError) => setError(messageFromError(requestError))).finally(() => setLoading(false)); }, []);
  return <><div className="page-heading"><div><p className="page-kicker">YOUR ACTIVITY</p><h1>Learning analytics</h1><p>Counts from your completed lessons and accepted practice attempts.</p></div></div>{error && <InlineError message={error} />}{loading ? <LoadingState label="Calculating your progress…" /> : rows.length ? <div className="analytics-table"><div className="analytics-head"><span>LANGUAGE</span><span>LESSONS COMPLETED</span><span>QUESTIONS SOLVED</span></div>{rows.map(([key, values]) => <div className="analytics-row" key={key}><strong>{languageNames[key] || "General"}</strong><span>{values.completedLessons}</span><span>{values.solvedQuestions}</span></div>)}</div> : <EmptyState title="Your progress will build here" text="Complete a lesson or solve a practice question to see your activity." action="Start a lesson" to="/lessons" />}</>;
}

/*
 * ============================================================
 * Function Name : ContentRow
 * Description   : Renders a consistent link row for a learning item.
 * Input         : One public content record.
 * Output        : Navigable title, language, and short description.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function ContentRow({ item }) {
  return <Link className="content-row" to={item.kind === "question" ? `/practice/${item._id}` : `/learn/${item._id}`}><div className="row-icon"><BookOpen size={17} /></div><div className="row-copy"><strong>{item.title}</strong><p>{item.description}</p></div><div className="row-meta"><span>{languageNames[item.language] || "GENERAL"}</span><ArrowRight size={16} /></div></Link>;
}

/*
 * ============================================================
 * Function Name : SubmissionTable
 * Description   : Displays submission verdicts without exposing other users.
 * Input         : Current user's submission records.
 * Output        : Responsive attempt table.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function SubmissionTable({ submissions }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>QUESTION</th><th>LANGUAGE</th><th>RESULT</th><th>TESTS</th><th>SUBMITTED</th></tr></thead><tbody>{submissions.map((submission) => <tr key={submission._id}><td>{submission.question?.title || "Practice question"}</td><td>{languageNames[submission.language] || submission.language}</td><td><span className={`result-chip ${submission.status === "accepted" ? "success" : "failed"}`}>{submission.status.replaceAll("_", " ")}</span></td><td>{submission.passedTests} / {submission.totalTests}</td><td>{submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div>;
}

/*
 * ============================================================
 * Function Name : LoadingState
 * Description   : Communicates that route data is loading.
 * Input         : Short loading label.
 * Output        : Accessible loading message.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function LoadingState({ label }) { return <div className="loading-state" role="status"><span className="loading-dot" />{label}</div>; }

/*
 * ============================================================
 * Function Name : InlineError
 * Description   : Shows a request failure and its message.
 * Input         : User-readable error string.
 * Output        : Alert region within the current page.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function InlineError({ message }) { return <div className="inline-alert error-alert" role="alert">{message}</div>; }

/*
 * ============================================================
 * Function Name : EmptyState
 * Description   : Offers a useful next action when a list is empty.
 * Input         : Title, explanation, and optional link or click action.
 * Output        : Contextual empty-state panel.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function EmptyState({ title, text, action, to, onClick }) {
  return <section className="empty-state"><span className="empty-icon"><BookOpen size={20} /></span><h2>{title}</h2><p>{text}</p>{action && (to ? <Link className="secondary-button" to={to}>{action}<ArrowRight size={14} /></Link> : <button className="secondary-button" onClick={onClick}>{action}</button>)}</section>;
}
