/*
 * ============================================================
 * File Name     : aiController.js
 * Description   : Validates and limits authenticated learning help requests.
 * Module        : Learning Assistant
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { getLearningHelp } from "../services/aiService.js";
import { getAiProviderConfig } from "../services/aiProviderConfig.js";
import { generatePracticeQuestion } from "../services/practiceQuestionService.js";

const languages = new Set(["c", "cpp", "java", "javascript"]);
const modes = new Set(["tutor", "hint", "explain", "analyze", "review", "dry_run", "practice_hint", "practice_explain", "practice_review"]);

/*
 * ============================================================
 * Function Name : requestLearningHelp
 * Description   : Returns a tutor answer, code walkthrough, or code review.
 * Input         : Mode, supported language, prompt, and optional code text.
 * Output        : Educational feedback or a safe provider error.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const requestLearningHelp = async (req, res, next) => {
  try {
    const { mode = "tutor", language = "javascript", prompt = "", code = "", stdin = "" } = req.body ?? {};
    if (!modes.has(mode) || !languages.has(language) || typeof prompt !== "string" || typeof code !== "string" || typeof stdin !== "string" || prompt.length > 1500 || code.length > 12000 || stdin.length > 20000) {
      return res.status(400).json({ success: false, message: "Choose a supported mode and language. Keep prompts below 1,500 characters, code below 12,000 characters, and input below 20,000 characters." });
    }
    const result = await getLearningHelp({ mode, language, prompt, code, stdin });
    const response = typeof result === "string" ? { answer: result } : result;
    res.json({ success: true, ...response, providerConfigured: getAiProviderConfig().configured });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : requestPracticeQuestion
 * Description   : Returns a structured practice question for a learner.
 * Input         : Supported language, topic, and difficulty from the request.
 * Output        : Generated challenge, or a validated built-in question.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const requestPracticeQuestion = async (req, res, next) => {
  try {
    const { language = "javascript", topic = "any", difficulty = "easy" } = req.body ?? {};
    if (typeof language !== "string" || typeof topic !== "string" || typeof difficulty !== "string") {
      return res.status(400).json({ success: false, message: "Choose a valid language, topic, and difficulty." });
    }
    const result = await generatePracticeQuestion({ language, topic, difficulty });
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return res.status(504).json({ success: false, message: "Question generation timed out. Try again." });
    if (error.message?.startsWith("Choose a supported")) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};
