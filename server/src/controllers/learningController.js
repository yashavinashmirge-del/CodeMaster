/*
 * ============================================================
 * File Name     : learningController.js
 * Description   : Handles progress, bookmarks, submissions, and analytics.
 * Module        : Student Learning
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import LearningItem from "../models/LearningItem.js";
import { Bookmark, Progress, Submission } from "../models/LearningRecord.js";

/*
 * ============================================================
 * Function Name : getLearningOverview
 * Description   : Builds a student's dashboard from persisted records.
 * Input         : Authenticated student request.
 * Output        : Completion counts, solved questions, bookmarks, and activity.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const getLearningOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [completed, viewed, accepted, bookmarks, recentSubmissions, publishedLessons, completedItems] = await Promise.all([
      Progress.countDocuments({ user: userId, completed: true }),
      Progress.countDocuments({ user: userId }),
      Submission.distinct("question", { user: userId, status: "accepted" }),
      Bookmark.countDocuments({ user: userId }),
      Submission.find({ user: userId }).populate("question", "title slug language difficulty").sort({ createdAt: -1 }).limit(5).lean(),
      LearningItem.countDocuments({ kind: "lesson", published: true }),
      Progress.find({ user: userId, completed: true }).distinct("item"),
    ]);
    res.json({
      success: true,
      overview: {
        completedLessons: completed,
        viewedLessons: viewed,
        totalLessons: publishedLessons,
        lessonPercent: publishedLessons ? Math.round((completed / publishedLessons) * 100) : 0,
        solvedQuestions: accepted.length,
        bookmarkedItems: bookmarks,
        completedItems: completedItems.map((itemId) => itemId.toString()),
        recentSubmissions,
      },
    });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : updateProgress
 * Description   : Records a student opening or completing a lesson or note.
 * Input         : Item ID and an optional completed Boolean.
 * Output        : Updated learner progress record.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const updateProgress = async (req, res, next) => {
  try {
    const item = await LearningItem.findOne({ _id: req.params.itemId, published: true, kind: { $in: ["lesson", "note"] } }).select("_id");
    if (!item) return res.status(404).json({ success: false, message: "Published lesson or note not found." });
    const updates = { lastViewedAt: new Date() };
    if (typeof req.body.completed === "boolean") updates.completed = req.body.completed;
    const progress = await Progress.findOneAndUpdate(
      { user: req.user._id, item: item._id },
      { $set: updates, $setOnInsert: { user: req.user._id, item: item._id } },
      { upsert: true, new: true, runValidators: true }
    ).populate("item", "title slug kind language");
    res.json({ success: true, progress });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : listBookmarks
 * Description   : Returns the authenticated student's saved items.
 * Input         : Authenticated student request.
 * Output        : Bookmarks with public content details.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const listBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id }).populate({ path: "item", match: { published: true }, select: "kind title slug description language difficulty" }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, bookmarks: bookmarks.filter((entry) => entry.item) });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : toggleBookmark
 * Description   : Adds or removes a saved item for the current student.
 * Input         : Published item ID and desired Boolean saved state.
 * Output        : Current saved state for the selected item.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const toggleBookmark = async (req, res, next) => {
  try {
    const item = await LearningItem.findOne({ _id: req.params.itemId, published: true }).select("_id");
    if (!item) return res.status(404).json({ success: false, message: "Published learning content not found." });
    if (req.body.saved === false) {
      await Bookmark.deleteOne({ user: req.user._id, item: item._id });
      return res.json({ success: true, saved: false });
    }
    await Bookmark.updateOne({ user: req.user._id, item: item._id }, { $setOnInsert: { user: req.user._id, item: item._id } }, { upsert: true });
    res.json({ success: true, saved: true });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : listSubmissions
 * Description   : Lists the authenticated student's recent code submissions.
 * Input         : Authenticated request with an optional question filter.
 * Output        : Up to 100 of the student's own submission records.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const listSubmissions = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.question) filter.question = req.query.question;
    const submissions = await Submission.find(filter).select("question language status passedTests totalTests output error runtimeMs createdAt").populate("question", "title slug").sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, submissions });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : getPersonalAnalytics
 * Description   : Summarizes a student's learning activity by language.
 * Input         : Authenticated student request.
 * Output        : Completion and accepted-submission counts by language.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const getPersonalAnalytics = async (req, res, next) => {
  try {
    const [progress, solved] = await Promise.all([
      Progress.find({ user: req.user._id, completed: true }).populate({ path: "item", select: "language kind" }).lean(),
      Submission.find({ user: req.user._id, status: "accepted" }).populate({ path: "question", select: "language" }).select("question").lean(),
    ]);
    const byLanguage = {};
    for (const record of progress) {
      const language = record.item?.language || "general";
      byLanguage[language] ??= { completedLessons: 0, solvedQuestions: 0 };
      byLanguage[language].completedLessons += 1;
    }
    const solvedQuestions = new Set();
    for (const record of solved) {
      const questionId = record.question?._id?.toString();
      if (!questionId || solvedQuestions.has(questionId)) continue;
      solvedQuestions.add(questionId);
      const language = record.question?.language || "general";
      byLanguage[language] ??= { completedLessons: 0, solvedQuestions: 0 };
      byLanguage[language].solvedQuestions += 1;
    }
    res.json({ success: true, byLanguage });
  } catch (error) { next(error); }
};
