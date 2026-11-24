/*
===============================================================================
PROJECT: CODEMASTER
FILE: adminRoutes.js
DESCRIPTION: Secure Admin management API routes
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED MODULES
// =============================================================================

import express from "express";

import { createAdmin } from "../controllers/adminController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

// =============================================================================
// 2. INITIALIZE ROUTER
// =============================================================================

const router = express.Router();

// =============================================================================
// 3. CREATE ADMIN ACCOUNT
// =============================================================================

/*
Function Name: Create Admin Route
Description: Allows only authenticated Super Admins to create Admin accounts.
Input: JWT authentication token and Admin account details.
Output: Newly created Admin account information.
Author: Your Name
Date: 23/11/2026
*/

router.post(
  "/create",
  protect,
  authorize("superadmin"),
  createAdmin
);

// =============================================================================
// 4. EXPORT ROUTER
// =============================================================================

export default router;
