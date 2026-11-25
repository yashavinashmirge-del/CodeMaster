/*
 * ============================================================
 * File Name     : superAdminController.js
 * Description   : Manages platform accounts for Super Admins.
 * Module        : Platform Administration
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import User from "../models/User.js";

/*
 * ============================================================
 * Function Name : listPlatformUsers
 * Description   : Lists paginated user accounts without password fields.
 * Input         : Page and optional role or search query parameters.
 * Output        : Platform user summaries and pagination information.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const listPlatformUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const filter = {};
    if (["student", "admin", "superadmin"].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.search) filter.$or = ["name", "email"].map((field) => ({ [field]: { $regex: String(req.query.search).slice(0, 80), $options: "i" } }));
    const [users, total] = await Promise.all([
      User.find(filter).select("name email role isActive lastLogin createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

/*
 * ============================================================
 * Function Name : setPlatformUserStatus
 * Description   : Activates or deactivates a student or Admin account.
 * Input         : Target user ID and Boolean active state.
 * Output        : Updated account summary or a validation error.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const setPlatformUserStatus = async (req, res, next) => {
  try {
    if (typeof req.body.active !== "boolean") return res.status(400).json({ success: false, message: "active must be true or false." });
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, role: { $in: ["student", "admin"] } },
      { $set: { isActive: req.body.active } },
      { new: true, runValidators: true }
    ).select("name email role isActive lastLogin createdAt");
    if (!user) return res.status(404).json({ success: false, message: "Student or Admin account not found." });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};
