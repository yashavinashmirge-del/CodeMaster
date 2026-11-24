
/*
===============================================================================
PROJECT: CODEMASTER
FILE: authController.js
DESCRIPTION: Handles user registration, login and profile authentication.
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED PACKAGES
// =============================================================================

import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =============================================================================
// 2. GENERATE JWT TOKEN
// =============================================================================

/*
Function Name: generateToken
Description: Generates a signed JWT for an authenticated user.
Input: User ID.
Output: Signed JWT access token.
Author: Your Name
Date: 23/11/2026
*/

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

// =============================================================================
// 3. REGISTER STUDENT
// =============================================================================

/*
Function Name: registerStudent
Description: Creates a new student account.
Input: Name, email and password.
Output: Created user information and JWT.
Author: Your Name
Date: 23/11/2026
*/

export const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields.
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    // Validate password length.
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    // Validate field types and lengths.
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 60 ||
      typeof email !== "string" ||
      email.trim().length > 254
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid registration details.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered.
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Always create public registrations as students.
    // Never accept a role from the registration request.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "student",
    });

    // Generate authentication token.
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      token,
      user,
    });
  } catch (error) {
    // Handle duplicate email race conditions.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
};

// =============================================================================
// 4. USER LOGIN
// =============================================================================

/*
Function Name: loginUser
Description: Authenticates an existing user.
Input: Email and password.
Output: JWT and authenticated user information.
Author: Your Name
Date: 23/11/2026
*/

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate login details.
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user and explicitly include the password hash.
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check account status.
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    // Compare submitted password with stored password hash.
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Update last login time.
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT.
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// 5. GET CURRENT USER PROFILE
// =============================================================================

/*
Function Name: getCurrentUser
Description: Returns the currently authenticated user's profile.
Input: Authenticated HTTP request.
Output: Current user information.
Author: Your Name
Date: 23/11/2026
*/

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
