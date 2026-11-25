/*
 * ============================================================
 * File Name     : LearningItem.js
 * Description   : Stores languages, topics, lessons, notes, and questions.
 * Module        : Learning Content
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import mongoose from "mongoose";

/* ============================================================
   CONTENT SCHEMAS
============================================================ */

const exampleSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120 },
    input: { type: String, maxlength: 4000 },
    output: { type: String, maxlength: 4000 },
    explanation: { type: String, maxlength: 4000 },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, maxlength: 4000 },
    expectedOutput: { type: String, maxlength: 4000 },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ============================================================
   LEARNING ITEM MODEL
============================================================ */

const learningItemSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["language", "topic", "lesson", "note", "question"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 1200, default: "" },
    body: { type: String, maxlength: 30000, default: "" },
    language: { type: String, trim: true, lowercase: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "LearningItem", default: null, index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    order: { type: Number, default: 0 },
    examples: { type: [exampleSchema], default: [] },
    hints: { type: [String], default: [] },
    constraints: { type: [String], default: [] },
    testCases: { type: [testCaseSchema], default: [] },
    published: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

learningItemSchema.index({ kind: 1, slug: 1 }, { unique: true });
learningItemSchema.index({ kind: 1, published: 1, language: 1, order: 1 });
learningItemSchema.index({ title: "text", description: "text", body: "text" });

const LearningItem = mongoose.model("LearningItem", learningItemSchema);

export default LearningItem;
