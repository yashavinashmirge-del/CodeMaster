/*
 * ============================================================
 * File Name     : dryRun.test.js
 * Description   : Tests the safe JavaScript expression and trace subset.
 * Module        : Frontend Unit Tests
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { dryRunJavaScript } from "./dryRun.js";

test("traces variables and arithmetic in statement order", () => {
  const trace = dryRunJavaScript("const width = 4;\nconst height = 3;\nconst area = width * height;\nconsole.log(area);");
  assert.equal(trace.length, 4);
  assert.equal(trace[2].variables.area, 12);
  assert.equal(trace[3].output, "12");
});

test("applies arithmetic precedence and parentheses", () => {
  const trace = dryRunJavaScript("const total = 2 + 3 * (4 - 1);\nconsole.log(total);");
  assert.equal(trace[0].variables.total, 11);
  assert.equal(trace[1].output, "11");
});

test("rejects unsupported branch and loop syntax instead of guessing", () => {
  assert.throws(() => dryRunJavaScript("let total = 0;\nfor (let i = 0; i < 2; i++) { total += i; }"), /does not simulate branches, loops/);
});

test("rejects expressions with unknown variables", () => {
  assert.throws(() => dryRunJavaScript("console.log(secret);"), /has not been assigned/);
});

test("does not invoke arbitrary JavaScript expressions", () => {
  assert.throws(() => dryRunJavaScript("process.exit();"), /does not support/);
});
