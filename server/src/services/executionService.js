/*
 * ============================================================
 * File Name     : executionService.js
 * Description   : Sends code to an isolated external Judge0 runner.
 * Module        : Code Execution
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

const languageIds = {
  c: Number(process.env.JUDGE0_LANGUAGE_ID_C) || 103,
  cpp: Number(process.env.JUDGE0_LANGUAGE_ID_CPP) || 105,
  java: Number(process.env.JUDGE0_LANGUAGE_ID_JAVA) || 91,
  javascript: Number(process.env.JUDGE0_LANGUAGE_ID_JAVASCRIPT) || 102,
};

const runnerRequest = async (url, options = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_AUTH_TOKEN) headers["X-Auth-Token"] = process.env.JUDGE0_AUTH_TOKEN;
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Isolated runner returned HTTP ${response.status}.`);
  return response.json();
};

/*
 * ============================================================
 * Function Name : isExecutionConfigured
 * Description   : Checks whether a separately hosted Judge0 service is set.
 * Input         : None.
 * Output        : True when a runner base URL is configured.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const isExecutionConfigured = () => Boolean(process.env.JUDGE0_URL);

/*
 * ============================================================
 * Function Name : executeInJudge0
 * Description   : Compiles and runs one source file in the configured sandbox.
 * Input         : Language key, source code, and one test case's standard input.
 * Output        : Judge0 compilation, runtime, stdout, and timing result.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const executeInJudge0 = async ({ language, sourceCode, stdin }) => {
  if (!isExecutionConfigured()) throw new Error("Isolated code execution is not configured. Set JUDGE0_URL to a secured Judge0 deployment.");
  const baseUrl = process.env.JUDGE0_URL.replace(/\/$/, "");
  const submission = await runnerRequest(`${baseUrl}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    body: JSON.stringify({ language_id: languageIds[language], source_code: sourceCode, stdin }),
  });
  if (!submission.token) throw new Error("Isolated runner did not return a submission token.");

  const resultUrl = `${baseUrl}/submissions/${encodeURIComponent(submission.token)}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory`;
  const deadline = Date.now() + 30000;
  let result = submission;
  while (result.status?.id === 1 || result.status?.id === 2 || !result.status) {
    if (Date.now() >= deadline) {
      const error = new Error("Isolated runner timed out while processing the submission.");
      error.name = "TimeoutError";
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
    result = await runnerRequest(resultUrl, { method: "GET" });
  }
  return result;
};
