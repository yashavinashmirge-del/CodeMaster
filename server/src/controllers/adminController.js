/*
===============================================================================
PROJECT: CODEMASTER
FILE: adminController.js
DESCRIPTION: Handles Admin account creation and management operations
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED MODULES
// =============================================================================

import User from "../models/User.js";

// =============================================================================
// 2. CREATE ADMIN ACCOUNT
// =============================================================================

/*
Function Name: createAdmin
Description: Creates a new Admin account when requested by a Super Admin.
Input: Admin name, email address, and password.
Output: Newly created Admin account details without the password.
Author: Your Name
Date: 23/11/2026
*/

export const createAdmin = async (req, res, next) => {
  try {
    // Extract Admin details from the request body.
    const { name, email, password } = req.body;

    // Validate required fields.
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    // Normalize input values.
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate name length.
    if (normalizedName.length < 2 || normalizedName.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name must contain between 2 and 60 characters.",
      });
    }

    // Validate email length.
    if (normalizedEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Email address is too long.",
      });
    }

    // Validate password length.
    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Admin password must contain at least 12 characters.",
      });
    }

    // Check whether the email is already registered.
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    // Create the Admin account.
    // The User model automatically hashes the password.
    const admin = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: "admin",
      isActive: true,
    });

    // Return account information without the password.
    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    // Handle duplicate email errors.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    // Forward unexpected errors to the global error handler.
    next(error);
  }
};
