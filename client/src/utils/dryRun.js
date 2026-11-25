/*
 * ============================================================
 * File Name     : dryRun.js
 * Description   : Traces a safe, deliberately small JavaScript subset.
 * Module        : Dry Run and Visualization
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

/*
 * ============================================================
 * Function Name : evaluateExpression
 * Description   : Parses arithmetic and comparison tokens without eval.
 * Input         : Expression text and a map of previously traced variables.
 * Output        : A number or Boolean result for supported expressions.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const evaluateExpression = (expression, variables) => {
  const pattern = /\s*(===|!==|==|!=|<=|>=|&&|\|\||[()+\-*/%<>!]|(?:\d+\.?\d*)|(?:[A-Za-z_$][\w$]*))\s*/gy;
  const tokens = [];
  let cursor = 0;
  while (cursor < expression.length) {
    pattern.lastIndex = cursor;
    const match = pattern.exec(expression);
    if (!match) throw new Error(`Unsupported expression near “${expression.slice(cursor, cursor + 14)}”.`);
    tokens.push(match[1]); cursor = pattern.lastIndex;
  }
  let index = 0;
  const primary = () => {
    const token = tokens[index++];
    if (token === "(") { const value = parseOr(); if (tokens[index++] !== ")") throw new Error("A closing parenthesis is missing."); return value; }
    if (token === "!") return !primary();
    if (token === "-") return -Number(primary());
    if (token === "+") return Number(primary());
    if (token === "true") return true;
    if (token === "false") return false;
    if (/^\d/.test(token || "")) return Number(token);
    if (token && Object.hasOwn(variables, token)) return variables[token];
    if (token) throw new Error(`Variable “${token}” has not been assigned yet.`);
    throw new Error("The expression is incomplete.");
  };
  const binary = (next, operators) => {
    let value = next();
    while (operators.includes(tokens[index])) {
      const operator = tokens[index++]; const right = next();
      if (operator === "*") value *= right;
      else if (operator === "/") value /= right;
      else if (operator === "%") value %= right;
      else if (operator === "+") value += right;
      else if (operator === "-") value -= right;
      else if (operator === "<") value = value < right;
      else if (operator === "<=") value = value <= right;
      else if (operator === ">") value = value > right;
      else if (operator === ">=") value = value >= right;
      else if (["===", "=="].includes(operator)) value = value === right;
      else if (["!==", "!="].includes(operator)) value = value !== right;
      else if (operator === "&&") value = Boolean(value && right);
      else if (operator === "||") value = Boolean(value || right);
    }
    return value;
  };
  const parseMultiplicative = () => binary(primary, ["*", "/", "%"]);
  const parseAdditive = () => binary(parseMultiplicative, ["+", "-"]);
  const parseComparison = () => binary(parseAdditive, ["<", "<=", ">", ">="]);
  const parseEquality = () => binary(parseComparison, ["===", "!==", "==", "!="]);
  const parseAnd = () => binary(parseEquality, ["&&"]);
  const parseOr = () => binary(parseAnd, ["||"]);
  const result = parseOr();
  if (index !== tokens.length) throw new Error(`Unsupported operator “${tokens[index]}”.`);
  return result;
};

/*
 * ============================================================
 * Function Name : dryRunJavaScript
 * Description   : Records variable changes and console output line by line.
 * Input         : JavaScript source containing simple declarations and logs.
 * Output        : Trace steps or an explanation of unsupported syntax.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const dryRunJavaScript = (source) => {
  if (typeof source !== "string" || source.length > 12000) throw new Error("Keep the JavaScript example below 12,000 characters.");
  if (/\b(if|else|for|while|switch|function|class|try|catch|async|await)\b/.test(source)) {
    throw new Error("This guided tracer focuses on straight-line code. It does not simulate branches, loops, functions, or asynchronous work yet.");
  }
  const variables = Object.create(null);
  const steps = [];
  source.split("\n").slice(0, 120).forEach((rawLine, index) => {
    const line = rawLine.replace(/\/\/.*$/, "").trim();
    if (!line) return;
    const declaration = line.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.+?);?$/);
    const assignment = line.match(/^([A-Za-z_$][\w$]*)\s*=\s*(?!=)(.+?);?$/);
    const output = line.match(/^console\.log\((.*)\);?$/);
    if (declaration || assignment) {
      const [, name, expression] = declaration || assignment;
      variables[name] = evaluateExpression(expression.replace(/;$/, "").trim(), variables);
      steps.push({ line: index + 1, code: rawLine.trim(), action: `Set ${name} to ${variables[name]}`, variables: { ...variables }, output: "" });
      return;
    }
    if (output) {
      const value = evaluateExpression(output[1], variables);
      steps.push({ line: index + 1, code: rawLine.trim(), action: "Write a value to the console", variables: { ...variables }, output: String(value) });
      return;
    }
    if (/^(?:\}|;)$/.test(line)) return;
    throw new Error(`Line ${index + 1} uses syntax this tracer does not support.`);
  });
  return steps;
};
