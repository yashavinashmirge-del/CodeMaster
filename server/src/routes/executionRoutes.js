/*
 * ============================================================
 * File Name     : executionRoutes.js
 * Description   : Exposes sandbox status and authenticated submissions.
 * Module        : Code Execution
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { getExecutionStatus, runCodeWithInput, runCustomCode, submitCode } from "../controllers/executionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const submissionLimiter = rateLimit({ windowMs: 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many submissions. Wait one minute and try again." } });
router.get("/status", getExecutionStatus);
router.post("/run", protect, authorize("student"), submissionLimiter, runCustomCode);
router.post("/:questionId/run", protect, authorize("student"), submissionLimiter, runCodeWithInput);
router.post("/:questionId", protect, authorize("student"), submissionLimiter, submitCode);

export default router;
