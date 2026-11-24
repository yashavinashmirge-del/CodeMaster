
/*
===============================================================================
PROJECT: CODEMASTER
FILE: createSuperAdmin.js
DESCRIPTION: Secure one-time Super Admin account initialization
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED PACKAGES AND MODELS
// =============================================================================

import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import connectDB from "../config/db.js";

// =============================================================================
// 2. CREATE SUPER ADMIN ACCOUNT
// =============================================================================

/*
Function Name: createSuperAdmin
Description: Creates the first Super Admin account securely.
Input: Environment variables containing Super Admin details.
Output: Newly created Super Admin account or an informative error.
Author: Your Name
Date: 23/11/2026
*/

const createSuperAdmin = async () => {
  try {
    // -------------------------------------------------------------------------
    // Validate required environment variables.
    // -------------------------------------------------------------------------

    const name = process.env.SUPER_ADMIN_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be configured."
      );
    }

    if (password.length < 12) {
      throw new Error(
        "Super Admin password must contain at least 12 characters."
      );
    }

    // -------------------------------------------------------------------------
    // Connect to MongoDB.
    // -------------------------------------------------------------------------

    await connectDB();

    // -------------------------------------------------------------------------
    // Prevent creation if a Super Admin already exists.
    // -------------------------------------------------------------------------

    const existingSuperAdmin = await User.findOne({
      role: "superadmin",
    });

    if (existingSuperAdmin) {
      console.log("A Super Admin account already exists.");
      console.log("Initialization cancelled.");
      return;
    }

    // -------------------------------------------------------------------------
    // Prevent duplicate email addresses.
    // -------------------------------------------------------------------------

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        "This email already belongs to another account. Use a different email."
      );
    }

    // -------------------------------------------------------------------------
    // Create the Super Admin account.
    // The User model automatically hashes the password before saving.
    // -------------------------------------------------------------------------

    const superAdmin = await User.create({
      name,
      email,
      password,
      role: "superadmin",
      isActive: true,
    });

    console.log("==============================================");
    console.log("       SUPER ADMIN CREATED SUCCESSFULLY");
    console.log("==============================================");
    console.log(`Name: ${superAdmin.name}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log("Password: [HIDDEN]");
    console.log("==============================================");
  } catch (error) {
    console.error("Super Admin initialization failed:", error.message);

    process.exitCode = 1;
  } finally {
    // Always close the database connection after initialization.
    await mongoose.disconnect();
  }
};

// =============================================================================
// 3. EXECUTE INITIALIZATION
// =============================================================================

createSuperAdmin();
