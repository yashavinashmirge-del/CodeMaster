/*
 * ============================================================
 * File Name     : superAdminRoutes.js
 * Description   : Restricts account administration to Super Admins.
 * Module        : Platform Administration
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import express from "express";
import { listPlatformUsers, setPlatformUserStatus } from "../controllers/superAdminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("superadmin"));
router.get("/users", listPlatformUsers);
router.patch("/users/:userId/status", setPlatformUserStatus);

export default router;
