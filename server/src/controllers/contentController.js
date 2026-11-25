/*
 * ============================================================
 * File Name     : contentController.js
 * Description   : Provides public learning content and admin authoring APIs.
 * Module        : Learning Content
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import mongoose from "mongoose";
import LearningItem from "../models/LearningItem.js";

const publicFields = "kind title slug description body language parent difficulty order examples hints constraints testCases published createdAt updatedAt";

/*
 * ============================================================
 * Function Name : listContent
 * Description   : Searches and paginates published learning content.
 * Input         : Express query parameters for kind, language, search, and page.
 * Output        : A page of matching public content and pagination metadata.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const listContent = async (req, res, next) => {
  try {
    const { kind, language, search = "", parent } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const filter = { published: true };
    if (kind) filter.kind = kind;
    if (language) filter.language = String(language).toLowerCase();
    if (parent && mongoose.isValidObjectId(parent)) filter.parent = parent;
    if (search.trim()) filter.$text = { $search: search.trim().slice(0, 100) };
    const [items, total] = await Promise.all([
      LearningItem.find(filter).select(publicFields).sort({ order: 1, title: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      LearningItem.countDocuments(filter),
    ]);
    for (const item of items) {
      if (item.kind === "question") item.testCases = (item.testCases ?? []).filter((testCase) => !testCase.isHidden);
    }
    res.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : getContent
 * Description   : Returns one published content item without hidden test data.
 * Input         : Express route parameter containing an item ID or slug.
 * Output        : Public content item or HTTP 404.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const getContent = async (req, res, next) => {
  try {
    const selector = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
    const item = await LearningItem.findOne({ ...selector, published: true }).select(publicFields).lean();
    if (!item) return res.status(404).json({ success: false, message: "Learning content was not found." });
    if (item.kind === "question") item.testCases = (item.testCases ?? []).filter((testCase) => !testCase.isHidden);
    res.json({ success: true, item });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : listManagedContent
 * Description   : Lists all content for authenticated content managers.
 * Input         : Express request with optional kind and search filters.
 * Output        : A bounded set of published and draft content records.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const listManagedContent = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.kind) filter.kind = req.query.kind;
    if (req.query.search) filter.title = { $regex: String(req.query.search).slice(0, 80), $options: "i" };
    const items = await LearningItem.find(filter).select("-testCases.isHidden").sort({ kind: 1, order: 1, title: 1 }).limit(300).lean();
    res.json({ success: true, items });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : createContent
 * Description   : Creates a language, topic, lesson, note, or question.
 * Input         : Validated content request and authenticated author.
 * Output        : Newly created content record.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const createContent = async (req, res, next) => {
  try {
    const item = await LearningItem.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, item });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "That content slug is already in use for this content type." });
    next(error);
  }
};

/*
 * ============================================================
 * Function Name : updateContent
 * Description   : Updates a selected learning content item.
 * Input         : Content ID and validated replacement fields.
 * Output        : Updated content record or HTTP 404.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const updateContent = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.createdBy;
    const item = await LearningItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Learning content was not found." });
    res.json({ success: true, item });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : deleteContent
 * Description   : Removes a content item managed by an Admin or Super Admin.
 * Input         : Content item ID.
 * Output        : Confirmation or HTTP 404.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const deleteContent = async (req, res, next) => {
  try {
    const item = await LearningItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Learning content was not found." });
    res.json({ success: true, message: "Content deleted." });
  } catch (error) { next(error); }
};
