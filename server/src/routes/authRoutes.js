
/*
===============================================================================
PROJECT: CODEMASTER
FILE: authRoutes.js
DESCRIPTION: Defines authentication API endpoints.
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED PACKAGES AND CONTROLLERS
// =============================================================================

import express from "express";

import {
  registerStudent,
  loginUser,
  getCurrentUser,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

// =============================================================================
// 2. INITIALIZE ROUTER
// =============================================================================

const router = express.Router();

// =============================================================================
// 3. PUBLIC AUTHENTICATION ROUTES
// =============================================================================

// Register a new Student account.
router.post("/register", registerStudent);

// Authenticate an existing user.
router.post("/login", loginUser);

// =============================================================================
// 4. PROTECTED AUTHENTICATION ROUTES
// =============================================================================

// Return the currently authenticated user's profile.
router.get("/me", protect, getCurrentUser);

// =============================================================================
// 5. EXPORT ROUTER
// =============================================================================

export default router;
