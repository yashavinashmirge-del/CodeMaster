/*
===============================================================================
PROJECT: CODEMASTER
FILE: resetSuperAdmin.js
DESCRIPTION: Updates the existing Super Admin credentials from server/.env.
AUTHOR: Your Name
DATE: 25/11/2026
===============================================================================
*/

import "dotenv/config";

import mongoose from "mongoose";
import User from "../models/User.js";
import connectDB from "../config/db.js";

/*
Function Name: resetSuperAdmin
Description: Updates the existing Super Admin using the configured name, email,
             and password. The User model hashes the password before saving.
Input: SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD in .env.
Output: A status message without revealing the password.
Author: Your Name
Date: 25/11/2026
*/
const resetSuperAdmin = async () => {
  try {
    const name = process.env.SUPER_ADMIN_NAME?.trim();
    const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error("SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be configured.");
    }
    if (name.length < 2 || name.length > 60) {
      throw new Error("Super Admin name must contain 2 to 60 characters.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("SUPER_ADMIN_EMAIL must be a valid email address.");
    }
    if (password.length < 12) {
      throw new Error("Super Admin password must contain at least 12 characters.");
    }

    await connectDB();

    const superAdmin = await User.findOne({ role: "superadmin" });
    if (!superAdmin) {
      throw new Error("No Super Admin exists. Run createSuperAdmin.js first.");
    }

    const emailOwner = await User.findOne({ email, _id: { $ne: superAdmin._id } });
    if (emailOwner) {
      throw new Error("The configured email belongs to another account. Choose a different SUPER_ADMIN_EMAIL.");
    }

    superAdmin.name = name;
    superAdmin.email = email;
    superAdmin.password = password;
    superAdmin.isActive = true;
    await superAdmin.save();

    console.log("Super Admin credentials updated successfully.");
    console.log(`Sign-in email: ${superAdmin.email}`);
    console.log("Password: [HIDDEN]");
  } catch (error) {
    console.error("Super Admin credential update failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetSuperAdmin();
