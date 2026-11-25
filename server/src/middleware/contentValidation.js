/*
 * ============================================================
 * File Name     : contentValidation.js
 * Description   : Validates and normalizes learning content inputs.
 * Module        : Content Validation
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

const allowedKinds = new Set(["language", "topic", "lesson", "note", "question"]);

/*
 * ============================================================
 * Function Name : validateContent
 * Description   : Rejects invalid content payloads before database writes.
 * Input         : Express request, response, and next middleware functions.
 * Output        : Continues with a normalized payload or returns HTTP 400.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const validateContent = (req, res, next) => {
  const { kind, title, slug, body = "" } = req.body ?? {};
  if (!allowedKinds.has(kind) || typeof title !== "string" || !title.trim() || typeof slug !== "string" || !slug.trim()) {
    return res.status(400).json({ success: false, message: "A valid kind, title, and slug are required." });
  }
  if (title.length > 160 || slug.length > 180 || typeof body !== "string" || body.length > 30000) {
    return res.status(400).json({ success: false, message: "One or more content fields exceed their allowed size." });
  }
  req.body = { ...req.body, title: title.trim(), slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") };
  next();
};
