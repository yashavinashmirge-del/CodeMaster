/*
 * ============================================================
 * File Name     : aiService.js
 * Description   : Routes learning help to an optional AI provider.
 * Module        : Learning Assistant
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { getAiProviderConfig } from "./aiProviderConfig.js";

const cleanCoachText = (value, limit = 700) => typeof value === "string"
  ? value.replace(/[`*_#]/g, "").trim().slice(0, limit)
  : "";

const parseCoachJson = (content) => {
  try {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    return start >= 0 && end > start ? JSON.parse(content.slice(start, end + 1)) : null;
  } catch {
    return null;
  }
};

const coachParagraphs = (content) => String(content ?? "")
  .split(/\r?\n/)
  .map((line) => cleanCoachText(line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, ""), 500))
  .filter(Boolean);

const normalizePracticeCoach = (mode, content) => {
  const parsed = parseCoachJson(content) ?? {};
  const paragraphs = coachParagraphs(content);
  if (mode === "practice_hint") {
    return {
      type: "hint",
      message: cleanCoachText(parsed.message) || paragraphs[0] || "Look at the input and output first, then identify the next small step your program needs to take.",
      nextStep: cleanCoachText(parsed.nextStep, 300),
    };
  }
  if (mode === "practice_explain") {
    const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : paragraphs.slice(1).map((detail, index) => ({ title: `Step ${index + 1}`, detail }));
    return {
      type: "explain",
      summary: cleanCoachText(parsed.summary) || paragraphs[0] || "Here is a walkthrough of the current solution.",
      steps: rawSteps.filter((step) => step && typeof step === "object").slice(0, 8).map((step, index) => ({
        title: cleanCoachText(step.title, 100) || `Step ${index + 1}`,
        detail: cleanCoachText(step.detail, 500),
        line: Number.isInteger(step.line) && step.line > 0 ? step.line : null,
      })).filter((step) => step.detail),
      takeaway: cleanCoachText(parsed.takeaway, 300) || paragraphs.at(-1) || "Check each value against the example input and expected output.",
    };
  }
  const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : paragraphs.slice(1).map((detail) => ({ detail }));
  const allowedVerdicts = new Set(["Looks on track", "Needs revision", "Partly correct", "Cannot determine yet"]);
  return {
    type: "review",
    verdict: allowedVerdicts.has(parsed.verdict) ? parsed.verdict : paragraphs[0]?.slice(0, 120) || "Review complete",
    findings: rawFindings.filter((finding) => finding && typeof finding === "object").slice(0, 8).map((finding) => ({
      status: ["issue", "check", "strength"].includes(finding.status) ? finding.status : /wrong|bug|incorrect|missing|fails|issue/i.test(finding.detail ?? "") ? "issue" : "check",
      title: cleanCoachText(finding.title, 100) || "Review note",
      detail: cleanCoachText(finding.detail, 500),
      line: Number.isInteger(finding.line) && finding.line > 0 ? finding.line : null,
    })).filter((finding) => finding.detail),
    nextAction: cleanCoachText(parsed.nextAction, 300) || paragraphs.at(-1) || "Run the solution against the example and test an edge case.",
  };
};

/*
 * ============================================================
 * Function Name : localCodeFeedback
 * Description   : Gives useful local feedback when no paid AI is configured.
 * Input         : Tutor mode, programming language, and learner prompt or code.
 * Output        : Short guidance generated without network access.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const localCodeFeedback = ({ mode, language, prompt, code }) => {
  const source = String(code ?? "").slice(0, 12000);
  const request = String(prompt ?? "").slice(0, 1500);
  if (mode === "practice_hint") {
    return { coach: { type: "hint", message: source.trim() ? "Trace one example by hand and write down each important value after the line that changes it." : "Break the requirements into input, processing, and output before writing the first line.", nextStep: "Try that small step in your editor, then ask for another hint if you get stuck." } };
  }
  if (mode === "practice_explain") {
    const statements = source.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 6);
    return { coach: {
      type: "explain",
      summary: `This built-in walkthrough can outline ${language} statements, but it cannot compile the code or verify runtime behavior.`,
      steps: statements.map((statement, index) => ({ title: `Line ${index + 1}`, detail: statement })),
      takeaway: request ? "Compare the walkthrough with the question requirements and sample output." : "Run the code with the example input to verify its behavior.",
    } };
  }
  if (mode === "practice_review") {
    const structuralReview = localCodeFeedback({ mode: "analyze", language, prompt, code: source });
    return { coach: {
      type: "review",
      verdict: source.trim() ? "Cannot determine yet" : "Needs revision",
      findings: [{ status: source.trim() ? "check" : "issue", title: "Built-in review limit", detail: structuralReview }],
      nextAction: "Connect an AI provider for review against the full problem, or run the solution and inspect its output.",
    } };
  }
  if (mode === "dry_run") {
    return `AI dry run needs an AI provider key. Add GROQ_API_KEY or AI_API_URL and AI_API_KEY to server/.env, then restart the backend. The local JavaScript tracer is available with Trace steps for supported straight-line code.`;
  }
  if (mode === "hint") {
    return `Hint for ${language}\n\nStart by identifying the input and the result the question asks for. Then work through one requirement at a time${source.trim() ? " and trace the values in your current code" : " before writing code"}.\n\nThis built-in hint is general guidance. Configure an AI provider for feedback tailored to the full question and solution.`;
  }
  if (mode === "review") {
    if (!source.trim()) return "Add your solution to the editor, then ask for a review.";
    const findings = [];
    if ((source.match(/\{/g) ?? []).length !== (source.match(/\}/g) ?? []).length) findings.push("Opening and closing brace counts differ. Check the code blocks.");
    if ((source.match(/\(/g) ?? []).length !== (source.match(/\)/g) ?? []).length) findings.push("Opening and closing parenthesis counts differ.");
    if (/\bwhile\s*\(\s*true\s*\)|\bfor\s*\(\s*;\s*;\s*\)/.test(source)) findings.push("A loop has no visible exit condition. Confirm it can terminate.");
    if (!findings.length) findings.push("No basic structural issue was detected. This local review does not compile the program or check hidden cases.");
    return `Local ${language} code review\n\n${findings.map((finding) => `• ${finding}`).join("\n")}\n\nConfigure an AI provider for feedback against the full question, input, and run output.`;
  }
  if (mode === "analyze") {
    const findings = [];
    if (!source.trim()) findings.push("Add code to the editor, then run the analysis again.");
    if ((source.match(/\{/g) ?? []).length !== (source.match(/\}/g) ?? []).length) findings.push("The number of opening and closing braces differs. Check your blocks and function bodies.");
    if ((source.match(/\(/g) ?? []).length !== (source.match(/\)/g) ?? []).length) findings.push("The number of opening and closing parentheses differs.");
    if (/\bwhile\s*\(\s*true\s*\)|\bfor\s*\(\s*;\s*;\s*\)/.test(source)) findings.push("This contains a loop with no visible exit condition. Confirm it can terminate.");
    if (/TODO|FIXME/.test(source)) findings.push("There is a TODO or FIXME marker that may indicate unfinished logic.");
    if (findings.length === 0) findings.push("No basic structural issue was detected. This local checker cannot compile or prove correctness; use the isolated runner for execution feedback.");
    return `Local ${language} review\n\n${findings.map((finding, index) => `${index + 1}. ${finding}`).join("\n")}`;
  }
  const modeTitle = mode === "explain" ? "Code walkthrough" : "Tutor response";
  const topic = request || "the code currently in your editor";
  return `${modeTitle} for ${language}\n\nStart with the goal: ${topic}.\n\nBreak the solution into three steps: identify the input, trace each operation in order, and check the resulting output. Try writing down the value of each important variable after every statement. If you share a smaller code sample or a specific expression, the explanation can be more precise.\n\nThis built-in guide works without a paid provider. Configure AI_API_URL and AI_API_KEY to enable provider-generated explanations.`;
};

const boundedText = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";

const buildSourceOutline = (code) => String(code ?? "")
  .split("\n")
  .map((statement, index) => ({ statement: statement.trim(), line: index + 1 }))
  .filter(({ statement }) => statement && !/^(\/\/|\*|\*\/|#)/.test(statement))
  .slice(0, 40)
  .map(({ statement, line }) => ({
    line,
    kind: /\b(if|else|switch|case|while|for)\b/.test(statement) ? "decision" : /\b(scanf|cin|nextInt|nextLine|readFileSync|input)\b/.test(statement) ? "input" : /\b(printf|console\.log|println|print)\b/.test(statement) ? "output" : "process",
    statement: statement.slice(0, 240),
    action: "Source statement shown in order; see the AI explanation for its predicted effect.",
    outcome: "",
    values: [],
  }));

const normalizeDryRun = (content, code) => {
  try {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("The AI response did not contain JSON.");
    const result = JSON.parse(content.slice(start, end + 1));
    const lineCount = String(code ?? "").split("\n").length;
    const rawSteps = Array.isArray(result.steps) ? result.steps : [];
    const steps = rawSteps.slice(0, 40).map((step) => {
      const rawValues = Array.isArray(step.values) ? step.values : Object.entries(step.values ?? {}).map(([name, value]) => ({ name, value }));
      return {
        line: Number.isInteger(step.line) && step.line > 0 && step.line <= lineCount ? step.line : null,
        kind: ["input", "process", "decision", "output"].includes(step.kind) ? step.kind : "process",
        statement: boundedText(step.statement, 240) || "Program step",
        action: boundedText(step.action, 320),
        outcome: boundedText(step.outcome, 120),
        values: rawValues.slice(0, 12).map((entry) => ({
          name: boundedText(entry.name, 60),
          value: boundedText(typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value), 120),
        })).filter(({ name }) => name),
      };
    });
    if (!steps.length) throw new Error("The AI response did not contain trace steps.");
    return {
      answer: boundedText(result.summary, 1200) || "AI trace prepared from the supplied code and input.",
      uncertainty: boundedText(result.uncertainty, 600),
      diagram: {
        quality: "ai-trace",
        steps,
        expectedOutput: boundedText(result.expectedOutput, 3000),
      },
    };
  } catch {
    return {
      answer: content.slice(0, 12000),
      uncertainty: "The provider response could not be formatted as a complete trace. This diagram shows source statements in order, not simulated variable values.",
      diagram: { quality: "source-outline", steps: buildSourceOutline(code), expectedOutput: "" },
    };
  }
};

/*
 * ============================================================
 * Function Name : getLearningHelp
 * Description   : Calls a configurable OpenAI-compatible tutor provider.
 * Input         : Tutor mode, language, prompt, and optional source code.
 * Output        : Provider-generated text or a local educational response.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const getLearningHelp = async ({ mode, language, prompt, code, stdin = "" }) => {
  const provider = getAiProviderConfig();
  if (!provider.configured) return localCodeFeedback({ mode, language, prompt, code });
  const practicePrompts = {
    practice_hint: `You are a Socratic ${language} coach. Return only JSON: {"message":"one progressive hint","nextStep":"one small action to try"}. Use the question, current solution, stdin, and run result. Do not give the full solution or repeat the previous hint. Keep the hint warm, specific, and concise.`,
    practice_explain: `You are a ${language} tutor. Return only JSON: {"summary":"one sentence about the solution's purpose","steps":[{"title":"short step title","detail":"explain one part using this code","line":1}],"takeaway":"one thing to remember"}. Explain the supplied code and values, not a generic algorithm. Include at most six useful steps. Do not invent runtime output.`,
    practice_review: `You are a supportive but rigorous ${language} reviewer. Return only JSON: {"verdict":"Looks on track|Needs revision|Partly correct|Cannot determine yet","findings":[{"status":"issue|check|strength","title":"short finding","detail":"specific evidence from the code or run","line":1}],"nextAction":"one concrete next action"}. Compare the code with the full question, constraints, sample, stdin, and latest run when available. Use at most six findings. Do not claim hidden tests passed unless the grader result is included.`,
  };
  const systemPrompt = mode === "dry_run"
    ? `You are a careful ${language} execution-trace tutor. Simulate the source using the exact standard input; never claim to execute it. Return only valid JSON with this shape: {"summary":"short explanation","uncertainty":"empty when certain, otherwise explain the limit","steps":[{"line":1,"kind":"input|process|decision|output","statement":"source statement","action":"what happens now","outcome":"selected branch or loop result, if any","values":[{"name":"variable","value":"value after this step"}]}],"expectedOutput":"exact predicted stdout"}. Trace the actual path in order. Include input reads, each executed statement, branch decisions, repeated loop iterations, variable changes, and output calls. Keep the diagram to at most 40 steps; summarize a long loop once it is clear. Use an empty array for values when none apply. State uncertainty rather than inventing missing input or behavior.`
    : practicePrompts[mode] || (mode === "hint"
      ? `You are a Socratic ${language} programming coach. Give exactly one useful hint for the supplied practice question and current code. Do not reveal the full solution, write replacement code, or give away the final answer. Match the requested hint level: early hints should point to the concept or next question; later hints may identify a specific step. Use the input and previous run result when provided. Keep the hint concise and encouraging.`
      : mode === "review"
        ? `You are a rigorous but supportive ${language} code reviewer. Compare the learner's code with the full practice requirements, constraints, examples, supplied standard input, and latest run result. Lead with a clear verdict (what looks correct and what remains uncertain), then list concrete issues with line references when possible, edge cases to check, and one next action. Do not claim hidden tests passed unless a published-question grader result is provided. Do not rewrite the entire solution.`
        : mode === "explain"
          ? `You are a patient ${language} programming tutor. Explain the learner's current code step by step in beginner-friendly language, describing important variables, branches, input, and output. Use the exact question context and standard input when provided. Do not invent runtime output.`
          : `You are a patient programming teacher. Explain ${language} in beginner-friendly steps. Do not claim that code is safe to run. Keep answers concise and educational.`);
  const userPrompt = mode === "dry_run"
    ? `Request: ${String(prompt ?? "").slice(0, 1500)}\nStandard input:\n${String(stdin ?? "").slice(0, 20000) || "(empty)"}\nSource code:\n${String(code ?? "").slice(0, 12000)}`
    : `Mode: ${mode}\nQuestion and requirements: ${String(prompt ?? "").slice(0, 1500)}\nStandard input:\n${String(stdin ?? "").slice(0, 20000) || "(empty)"}\nCode:\n${String(code ?? "").slice(0, 12000)}`;
  const response = await fetch(`${provider.apiUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.3,
      max_tokens: mode === "dry_run" ? 2400 : mode.startsWith("practice_") ? 1600 : 1200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`The configured AI provider returned HTTP ${response.status}.`);
  const result = await response.json();
  const answer = result.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new Error("The configured AI provider returned an empty response.");
  if (mode === "dry_run") return normalizeDryRun(answer, code);
  if (mode.startsWith("practice_")) return { coach: normalizePracticeCoach(mode, answer) };
  return answer.slice(0, 12000);
};
