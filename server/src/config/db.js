
/*
===============================================================================
PROJECT: CODEMASTER
FILE: db.js
DESCRIPTION: MongoDB Atlas database connection configuration
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED PACKAGE
// =============================================================================

import mongoose from "mongoose";

// =============================================================================
// 2. CONNECT TO MONGODB
// =============================================================================

/*
Function Name: connectDB
Description: Connects the CodeMaster backend to MongoDB Atlas.
Input: MONGODB_URI environment variable
Output: Active MongoDB database connection
Author: Your Name
Date: 23/11/2026
*/

const connectDB = async () => {
  try {
    // Check whether the database connection string exists.
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file.");
    }

    // Establish the MongoDB connection.
  const connection = await mongoose.connect(process.env.MONGODB_URI, {
  dbName: "codemaster",
});

    console.log("==============================================");
    console.log("       MONGODB DATABASE CONNECTED");
    console.log("==============================================");
    console.log(`Database Host: ${connection.connection.host}`);
    console.log(`Database Name: ${connection.connection.name}`);
    console.log("==============================================");

    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

// =============================================================================
// 3. EXPORT DATABASE FUNCTION
// =============================================================================

export default connectDB;
