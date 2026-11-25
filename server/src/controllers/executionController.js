/*
 * ============================================================
 * File Name     : executionController.js
 * Description   : Validates and grades code through an isolated runner.
 * Module        : Code Execution
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import LearningItem from "../models/LearningItem.js";
import { Submission } from "../models/LearningRecord.js";
import { executeInJudge0, isExecutionConfigured } from "../services/executionService.js";

const supportedLanguages = new Set(["c", "cpp", "java", "javascript"]);
const statusLabels = { 3: "accepted", 4: "wrong_answer", 5: "time_limit_exceeded", 6: "compilation_error", 7: "runtime_error", 8: "runtime_error", 9: "runtime_error", 10: "runtime_error", 11: "runtime_error", 12: "runtime_error" };

/*
 * ============================================================
 * Function Name : getExecutionStatus
 * Description   : Reports whether a sandbox has been configured.
 * Input         : HTTP request.
 * Output        : Runner availability without exposing configuration secrets.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const getExecutionStatus = (req, res) => res.json({ success: true, configured: isExecutionConfigured() });

/*
 * ============================================================
 * Function Name : runCodeWithInput
 * Description   : Runs one program with learner-provided standard input.
 * Input         : Question ID, supported language, source code, and stdin.
 * Output        : Raw execution output without recording a graded submission.
 * Author        : Your Name
 * Date          : 24/11/2026
 * ============================================================
 */
export const runCodeWithInput = async (req, res, next) => {
  try {
    const { language, sourceCode, stdin = "" } = req.body ?? {};
    if (!supportedLanguages.has(language) || typeof sourceCode !== "string" || !sourceCode.trim() || sourceCode.length > 30000 || typeof stdin !== "string" || stdin.length > 20000) {
      return res.status(400).json({ success: false, message: "Choose a supported language, provide code under 30,000 characters, and input under 20,000 characters." });
    }
    const question = await LearningItem.findOne({ _id: req.params.questionId, kind: "question", published: true }).select("_id").lean();
    if (!question) return res.status(404).json({ success: false, message: "Published practice question not found." });
    if (!isExecutionConfigured()) return res.status(503).json({ success: false, code: "RUNNER_NOT_CONFIGURED", message: "Code execution is not available yet. Configure the isolated Judge0 runner to enable runs." });

    const result = await executeInJudge0({ language, sourceCode, stdin });
    res.json({ success: true, result: {
      status: statusLabels[result.status?.id] ?? "runtime_error",
      statusDescription: result.status?.description ?? "Unknown status",
      output: (result.stdout ?? "").slice(0, 20000),
      error: (result.compile_output ?? result.stderr ?? result.message ?? "").slice(0, 8000),
      runtimeMs: Number.isFinite(Number(result.time)) ? Math.round(Number(result.time) * 1000) : null,
    } });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return res.status(504).json({ success: false, message: "The isolated runner timed out. Try again with a smaller program." });
    next(error);
  }
};

/*
 * ============================================================
 * Function Name : runCustomCode
 * Description   : Runs an unsaved AI practice solution in Judge0.
 * Input         : Supported language, source code, and standard input.
 * Output        : Bounded execution result without persistent grading.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const runCustomCode = async (req, res, next) => {
  try {
    const { language, sourceCode, stdin = "" } = req.body ?? {};
    if (!supportedLanguages.has(language) || typeof sourceCode !== "string" || !sourceCode.trim() || sourceCode.length > 30000 || typeof stdin !== "string" || stdin.length > 20000) {
      return res.status(400).json({ success: false, message: "Choose a supported language, provide code under 30,000 characters, and input under 20,000 characters." });
    }
    if (!isExecutionConfigured()) return res.status(503).json({ success: false, code: "RUNNER_NOT_CONFIGURED", message: "Code execution is not available yet. Configure the isolated Judge0 runner to enable runs." });

    const result = await executeInJudge0({ language, sourceCode, stdin });
    res.json({ success: true, result: {
      status: statusLabels[result.status?.id] ?? "runtime_error",
      statusDescription: result.status?.description ?? "Unknown status",
      output: (result.stdout ?? "").slice(0, 20000),
      error: (result.compile_output ?? result.stderr ?? result.message ?? "").slice(0, 8000),
      runtimeMs: Number.isFinite(Number(result.time)) ? Math.round(Number(result.time) * 1000) : null,
    } });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return res.status(504).json({ success: false, message: "The isolated runner timed out. Try again with a smaller program." });
    next(error);
  }
};

/*
 * ============================================================
 * Function Name : submitCode
 * Description   : Runs visible and hidden tests in the remote code sandbox.
 * Input         : Question ID, supported language key, and source code.
 * Output        : Persisted verdict and feedback for the student's attempt.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const submitCode = async (req, res, next) => {
  try {
    const { language, sourceCode } = req.body ?? {};
    if (!supportedLanguages.has(language) || typeof sourceCode !== "string" || !sourceCode.trim() || sourceCode.length > 30000) {
      return res.status(400).json({ success: false, message: "Choose a supported language and provide code under 30,000 characters." });
    }
    const question = await LearningItem.findOne({ _id: req.params.questionId, kind: "question", published: true }).select("title language testCases").lean();
    if (!question) return res.status(404).json({ success: false, message: "Published practice question not found." });
    const testCases = (question.testCases ?? []).slice(0, 12);
    if (!testCases.length) return res.status(409).json({ success: false, message: "This question has no test cases configured." });
    if (!isExecutionConfigured()) return res.status(503).json({ success: false, code: "RUNNER_NOT_CONFIGURED", message: "Code execution is not available yet. Configure the isolated Judge0 runner to enable submissions." });

    let passedTests = 0;
    let resultOutput = "";
    let resultError = "";
    let runtimeMs = null;
    let status = "accepted";
    for (const testCase of testCases) {
      const result = await executeInJudge0({ language, sourceCode, stdin: testCase.input ?? "" });
      const judgeStatus = result.status?.id;
      resultOutput = (result.stdout ?? "").slice(0, 20000);
      resultError = (result.compile_output ?? result.stderr ?? result.message ?? "").slice(0, 8000);
      runtimeMs = Number.isFinite(Number(result.time)) ? Math.round(Number(result.time) * 1000) : null;
      if (judgeStatus !== 3) {
        status = statusLabels[judgeStatus] ?? "runtime_error";
        break;
      }
      if (resultOutput.trim().replace(/\r\n/g, "\n") !== (testCase.expectedOutput ?? "").trim().replace(/\r\n/g, "\n")) {
        status = "wrong_answer";
        break;
      }
      passedTests += 1;
    }
    const submission = await Submission.create({ user: req.user._id, question: question._id, language, sourceCode, status, passedTests, totalTests: testCases.length, output: resultOutput, error: resultError, runtimeMs });
    res.status(201).json({ success: true, submission: { id: submission._id, status, passedTests, totalTests: testCases.length, output: resultOutput, error: resultError, runtimeMs } });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return res.status(504).json({ success: false, message: "The isolated runner timed out. Try again with a smaller program." });
    next(error);
  }
};
