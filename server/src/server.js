
/*
===============================================================================
PROJECT: CODEMASTER
FILE: server.js
DESCRIPTION: Main Express backend server and API configuration
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED PACKAGES AND MODULES
// =============================================================================
import mongoose from "mongoose";
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// =============================================================================
// 2. INITIALIZE EXPRESS APPLICATION
// =============================================================================

const app = express();

// =============================================================================
// 3. LOAD ENVIRONMENT CONFIGURATION
// =============================================================================

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

// =============================================================================
// 4. APPLY SECURITY MIDDLEWARE
// =============================================================================

// Set secure HTTP response headers.
app.use(helmet());

// Configure Cross-Origin Resource Sharing.
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Parse incoming JSON request bodies.
app.use(express.json({ limit: "1mb" }));

// Parse URL-encoded request bodies.
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// =============================================================================
// 5. CONFIGURE API RATE LIMITING
// =============================================================================

/*
Function Name: API Rate Limiter
Description: Limits repeated API requests to reduce abuse.
Input: Incoming HTTP requests.
Output: Allows requests within the configured limit.
Author: Your Name
Date: 23/11/2026
*/

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// =============================================================================
// 6. HEALTH CHECK ROUTE
// =============================================================================

/*
Function Name: Health Check
Description: Checks whether the backend server is running.
Input: HTTP GET request.
Output: Server status and database connection status.
Author: Your Name
Date: 23/11/2026
*/

app.get("/api/health", (req, res) => {
  const databaseConnected =
    Boolean(
      globalThis.mongooseConnectionReadyState === 1
    );

  res.status(200).json({
    success: true,
    message: "CodeMaster API is running.",
    server: "online",
    database: databaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// 7. AUTHENTICATION API ROUTES
// =============================================================================

/*
Function Name: Authentication Routes
Description: Handles student registration, login, and current-user requests.
Input: Authentication API requests.
Output: Authentication responses.
Author: Your Name
Date: 23/11/2026
*/

app.use("/api/auth", authRoutes);

// =============================================================================
// 8. ADMIN MANAGEMENT API ROUTES
// =============================================================================

/*
Function Name: Admin Management Routes
Description: Provides Super Admin-only Admin account management endpoints.
Input: Authenticated Admin management requests.
Output: Admin management responses.
Author: Your Name
Date: 23/11/2026
*/

app.use("/api/admin", adminRoutes);

// =============================================================================
// 9. ROOT API ROUTE
// =============================================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CodeMaster API.",
    version: "1.0.0",
  });
});

// =============================================================================
// 10. HANDLE UNKNOWN API ROUTES
// =============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =============================================================================
// 11. GLOBAL ERROR HANDLER
// =============================================================================

/*
Function Name: Global Error Handler
Description: Handles unexpected application errors.
Input: Error, request, response, and next middleware.
Output: Standardized JSON error response.
Author: Your Name
Date: 23/11/2026
*/

app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : error.message || "Internal server error.",
  });
});

// =============================================================================
// 12. START SERVER AFTER DATABASE CONNECTION
// =============================================================================

/*
Function Name: startServer
Description: Connects to MongoDB and starts the Express server.
Input: None.
Output: Running HTTP server.
Author: Your Name
Date: 23/11/2026
*/

const startServer = async () => {
  try {
    // Establish MongoDB connection before accepting requests.
    await connectDB();

    // Start Express HTTP server.
    app.listen(PORT, () => {
      console.log("==============================================");
      console.log("        CODEMASTER BACKEND SERVER");
      console.log("==============================================");
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Server URL: http://localhost:${PORT}`);
      console.log(`Health URL: http://localhost:${PORT}/api/health`);
      console.log(`Client URL: ${CLIENT_URL}`);
      console.log("Database: Connected");
      console.log("==============================================");
    });
  } catch (error) {
    console.error("Failed to start CodeMaster server:");
    console.error(error.message);

    process.exit(1);
  }
};

// =============================================================================
// 13. EXECUTE SERVER STARTUP
// =============================================================================

startServer();
