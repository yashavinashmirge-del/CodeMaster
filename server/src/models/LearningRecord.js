/*
 * ============================================================
 * File Name     : LearningRecord.js
 * Description   : Stores learner progress, bookmarks, and submissions.
 * Module        : Learning Records
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import mongoose from "mongoose";

/* ============================================================
   PROGRESS MODEL
============================================================ */

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "LearningItem", required: true },
    completed: { type: Boolean, default: false },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

progressSchema.index({ user: 1, item: 1 }, { unique: true });

/* ============================================================
   BOOKMARK MODEL
============================================================ */

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "LearningItem", required: true },
  },
  { timestamps: true, versionKey: false }
);

bookmarkSchema.index({ user: 1, item: 1 }, { unique: true });

/* ============================================================
   SUBMISSION MODEL
============================================================ */

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "LearningItem", required: true },
    language: { type: String, enum: ["c", "cpp", "java", "javascript"], required: true },
    sourceCode: { type: String, required: true, maxlength: 30000 },
    status: {
      type: String,
      enum: ["accepted", "wrong_answer", "runtime_error", "compilation_error", "pending", "service_unavailable"],
      required: true,
    },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    output: { type: String, maxlength: 20000, default: "" },
    error: { type: String, maxlength: 8000, default: "" },
    runtimeMs: { type: Number, default: null },
  },
  { timestamps: true, versionKey: false }
);

submissionSchema.index({ user: 1, question: 1, createdAt: -1 });

export const Progress = mongoose.model("Progress", progressSchema);
export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export const Submission = mongoose.model("Submission", submissionSchema);
