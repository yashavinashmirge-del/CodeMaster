/*
 * ============================================================
 * File Name     : learningRoutes.js
 * Description   : Protects learner progress and personal records.
 * Module        : Student Learning
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import express from "express";
import { getLearningOverview, getPersonalAnalytics, listBookmarks, listSubmissions, toggleBookmark, updateProgress } from "../controllers/learningController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("student"));
router.get("/overview", getLearningOverview);
router.get("/analytics", getPersonalAnalytics);
router.get("/bookmarks", listBookmarks);
router.put("/bookmarks/:itemId", toggleBookmark);
router.get("/submissions", listSubmissions);
router.put("/progress/:itemId", updateProgress);

export default router;
