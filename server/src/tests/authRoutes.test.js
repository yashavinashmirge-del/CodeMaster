/*
 * ============================================================
 * File Name     : authRoutes.test.js
 * Description   : Checks authentication validation and protected route guards.
 * Module        : Backend Tests
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import authRoutes from "../routes/authRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import contentRoutes from "../routes/contentRoutes.js";
import learningRoutes from "../routes/learningRoutes.js";
import executionRoutes from "../routes/executionRoutes.js";
import aiRoutes from "../routes/aiRoutes.js";
import superAdminRoutes from "../routes/superAdminRoutes.js";
import { authorize } from "../middleware/authMiddleware.js";

process.env.JWT_SECRET ||= "codemaster-test-signing-key-not-for-production";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/execution", executionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/superadmin", superAdminRoutes);

let server;
let baseUrl;

/*
 * ============================================================
 * Function Name : startTestServer
 * Description   : Starts a loopback-only HTTP server for route tests.
 * Input         : None.
 * Output        : Test API base URL on an ephemeral local port.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

/*
 * ============================================================
 * Function Name : stopTestServer
 * Description   : Closes the loopback test server after API checks finish.
 * Input         : None.
 * Output        : No open HTTP listener remains.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

/*
 * ============================================================
 * Function Name : request
 * Description   : Sends one request to the local CodeMaster test server.
 * Input         : Route path and optional fetch request settings.
 * Output        : Parsed HTTP response.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await response.json() };
};

test("registration rejects incomplete details before database access", async () => {
  const { response, body } = await request("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "", email: "", password: "" }) });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("login rejects incomplete details before database access", async () => {
  const { response } = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "", password: "" }) });
  assert.equal(response.status, 400);
});

test("current-user endpoint rejects a missing JWT", async () => {
  const { response } = await request("/api/auth/me");
  assert.equal(response.status, 401);
});

test("Admin creation rejects a missing JWT", async () => {
  const { response } = await request("/api/admin/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
  assert.equal(response.status, 401);
});

test("all protected student and staff APIs reject anonymous requests", async () => {
  const protectedRequests = [
    ["/api/content/manage", {}],
    ["/api/learning/overview", {}],
    ["/api/execution/question-id", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }],
    ["/api/ai/help", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }],
    ["/api/superadmin/users", {}],
  ];
  for (const [path, options] of protectedRequests) {
    const { response } = await request(path, options);
    assert.equal(response.status, 401, `${path} must reject anonymous requests`);
  }
});

/*
 * ============================================================
 * Function Name : runAuthorizationCheck
 * Description   : Invokes role middleware with a selected synthetic user.
 * Input         : Allowed roles and a user role under test.
 * Output        : Status or whether the request passed authorization.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const runAuthorizationCheck = (allowedRoles, userRole) => {
  let passed = false;
  let status = 200;
  const response = { status(code) { status = code; return this; }, json() { return this; } };
  authorize(...allowedRoles)({ user: { role: userRole } }, response, () => { passed = true; });
  return { passed, status };
};

test("student cannot use Admin or Super Admin authorization", () => {
  assert.equal(runAuthorizationCheck(["admin", "superadmin"], "student").status, 403);
  assert.equal(runAuthorizationCheck(["superadmin"], "student").status, 403);
});

test("Admin can manage content but cannot use Super Admin authorization", () => {
  assert.equal(runAuthorizationCheck(["admin", "superadmin"], "admin").passed, true);
  assert.equal(runAuthorizationCheck(["superadmin"], "admin").status, 403);
});

test("Super Admin passes Admin and Super Admin authorization checks", () => {
  assert.equal(runAuthorizationCheck(["admin", "superadmin"], "superadmin").passed, true);
  assert.equal(runAuthorizationCheck(["superadmin"], "superadmin").passed, true);
});
