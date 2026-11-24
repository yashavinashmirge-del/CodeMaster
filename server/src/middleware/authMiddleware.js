
/*
===============================================================================
PROJECT: CODEMASTER
FILE: authMiddleware.js
DESCRIPTION: Handles JWT authentication and role-based authorization.
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
// 2. AUTHENTICATION MIDDLEWARE
// =============================================================================

/*
Function Name: protect
Description: Verifies the JWT and identifies the authenticated user.
Input: HTTP request containing a Bearer token.
Output: Authenticated user attached to req.user.
Author: Your Name
Date: 23/11/2026
*/

export const protect = async (req, res, next) => {
  try {
    // Check whether the authorization header exists.
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Extract the JWT from the Bearer authorization header.
    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    // Verify the token signature and expiration.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user associated with the token.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // Prevent suspended or deactivated accounts from accessing the API.
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    // Attach the authenticated user to the request.
    req.user = user;

    next();
  } catch (error) {
    // Handle invalid or expired JWT tokens.
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    next(error);
  }
};

// =============================================================================
// 3. ROLE-BASED AUTHORIZATION MIDDLEWARE
// =============================================================================

/*
Function Name: authorize
Description: Restricts API access to specified user roles.
Input: One or more permitted roles.
Output: Allows authorized users to continue; rejects unauthorized users.
Author: Your Name
Date: 23/11/2026
*/

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Authentication must run before authorization.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please authenticate before accessing this resource.",
      });
    }

    // Check whether the user's role is permitted.
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
};
