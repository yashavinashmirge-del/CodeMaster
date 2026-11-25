/*
===============================================================================
PROJECT: CODEMASTER
FILE: User.js
DESCRIPTION: Defines the User database model and authentication methods.
AUTHOR: Your Name
DATE: 23/11/2026
===============================================================================
*/

// =============================================================================
// 1. IMPORT REQUIRED PACKAGES
// =============================================================================

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// =============================================================================
// 2. DEFINE USER SCHEMA
// =============================================================================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters."],
      maxlength: [60, "Name cannot exceed 60 characters."]
    },

    email: {
      type: String,
      required: [true, "Email address is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address."
      ]
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must contain at least 8 characters."],
      select: false
    },

    oauth: {
      googleId: { type: String, unique: true, sparse: true, select: false },
      githubId: { type: String, unique: true, sparse: true, select: false }
    },

    role: {
      type: String,
      enum: ["student", "admin", "superadmin"],
      default: "student",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    profile: {
      avatar: {
        type: String,
        default: ""
      },
      bio: {
        type: String,
        default: "",
        maxlength: 250
      }
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// =============================================================================
// 3. HASH PASSWORD BEFORE SAVING
// =============================================================================

/*
Function Name: hashPassword
Description: Securely hashes the password before saving the user.
Input: User document.
Output: Hashed password stored in MongoDB.
Author: Your Name
Date: 23/11/2026
*/

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// =============================================================================
// 4. COMPARE PASSWORD
// =============================================================================

/*
Function Name: comparePassword
Description: Compares a login password against the stored password hash.
Input: Candidate password.
Output: True if passwords match; otherwise false.
Author: Your Name
Date: 23/11/2026
*/

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// =============================================================================
// 5. REMOVE PASSWORD FROM JSON RESPONSES
// =============================================================================

userSchema.set("toJSON", {
  transform: function (document, returnedObject) {
    delete returnedObject.password;
    return returnedObject;
  }
});

// =============================================================================
// 6. EXPORT USER MODEL
// =============================================================================

const User = mongoose.model("User", userSchema);

export default User;
