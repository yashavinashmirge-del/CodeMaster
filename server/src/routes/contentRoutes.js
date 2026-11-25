/*
 * ============================================================
 * File Name     : contentRoutes.js
 * Description   : Routes public learning and protected content authoring.
 * Module        : Learning Content
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import express from "express";
import { createContent, deleteContent, getContent, listContent, listManagedContent, updateContent } from "../controllers/contentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validateContent } from "../middleware/contentValidation.js";

const router = express.Router();
router.get("/", listContent);
router.get("/manage", protect, authorize("admin", "superadmin"), listManagedContent);
router.get("/:id", getContent);
router.post("/", protect, authorize("admin", "superadmin"), validateContent, createContent);
router.put("/:id", protect, authorize("admin", "superadmin"), validateContent, updateContent);
router.delete("/:id", protect, authorize("admin", "superadmin"), deleteContent);

export default router;
