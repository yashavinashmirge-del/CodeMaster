/*
 * ============================================================
 * File Name     : aiRoutes.js
 * Description   : Protects and rate-limits authenticated learning assistant calls.
 * Module        : Learning Assistant
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { requestLearningHelp, requestPracticeQuestion } from "../controllers/aiController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const helpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "You have reached the hourly learning-help limit. Try again later." } });
router.post("/help", protect, authorize("student", "admin", "superadmin"), helpLimiter, requestLearningHelp);
router.post("/practice-question", protect, authorize("student", "admin", "superadmin"), helpLimiter, requestPracticeQuestion);

export default router;
