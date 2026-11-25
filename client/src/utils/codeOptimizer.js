/*
 * ============================================================
 * File Name     : codeOptimizer.js
 * Description   : Finds a few safe, explainable code simplifications.
 * Module        : Code Analysis
 * Author        : Your Name
 * Date          : 24/11/2026
 * ============================================================
 */

const assignmentPrefix = String.raw`(\s*(?:(?:const|let|var|int|long|double|float|short|auto|static|final|unsigned|bool|boolean|char)\s+)*[A-Za-z_$][\w$]*\s*=\s*)`;

/*
 * ============================================================
 * Function Name : optimizeCode
 * Description   : Suggests conservative arithmetic simplifications.
 * Input         : Source code and its language key.
 * Output        : Line-level suggestions with optional replacement text.
 * Author        : Your Name
 * Date          : 24/11/2026
 * ============================================================
 */
export const optimizeCode = (source, language) => {
  if (typeof source !== "string" || source.length > 30000) return [];
  const suggestions = [];

  source.split("\n").forEach((line, index) => {
    const lineNumber = index + 1;
    const constantPattern = new RegExp(`^${assignmentPrefix}(-?\\d+(?:\\.\\d+)?)\\s*([+*/%-])\\s*(-?\\d+(?:\\.\\d+)?)(\\s*;?\\s*(?:\\/\\/.*)?)$`);
    const constantMatch = line.match(constantPattern);
    if (constantMatch) {
      const [, prefix, leftText, operator, rightText, suffix] = constantMatch;
      const left = Number(leftText);
      const right = Number(rightText);
      const value = operator === "+" ? left + right
        : operator === "-" ? left - right
          : operator === "*" ? left * right
            : operator === "/" ? right === 0 ? NaN : left / right
              : right === 0 ? NaN : left % right;
      if (Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value))) {
        suggestions.push({
          id: `constant-${lineNumber}`,
          line: lineNumber,
          title: "Fold constant arithmetic",
          explanation: "Both operands are numeric literals, so this expression can be calculated before the program runs.",
          before: line,
          after: `${prefix}${value}${suffix}`,
        });
        return;
      }
    }

    const identityPattern = new RegExp(`^${assignmentPrefix}([A-Za-z_$][\\w$]*|0|1)\\s*([+*/-])\\s*([A-Za-z_$][\\w$]*|0|1)(\\s*;?\\s*(?:\\/\\/.*)?)$`);
    const identityMatch = line.match(identityPattern);
    if (!identityMatch) return;
    const [, prefix, left, operator, right, suffix] = identityMatch;
    let simplified = null;
    if (operator === "+" && left === "0") simplified = right;
    else if (operator === "+" && right === "0") simplified = left;
    else if (operator === "-" && right === "0") simplified = left;
    else if (operator === "*" && left === "1") simplified = right;
    else if (operator === "*" && right === "1") simplified = left;
    else if (operator === "/" && right === "1") simplified = left;
    if (!simplified) return;

    suggestions.push({
      id: `identity-${lineNumber}`,
      line: lineNumber,
      title: "Remove a neutral arithmetic operation",
      explanation: `For numeric values, ${left} ${operator} ${right} has the same value as ${simplified}.`,
      before: line,
      after: `${prefix}${simplified}${suffix}`,
    });
  });

  if (language === "javascript") {
    source.split("\n").forEach((line, index) => {
      const match = line.match(/^(\s*if\s*\(\s*)([A-Za-z_$][\w$]*)\s*===\s*true(\s*\)\s*\{?\s*(?:\/\/.*)?)$/);
      if (!match) return;
      suggestions.push({
        id: `boolean-${index + 1}`,
        line: index + 1,
        title: "Simplify a boolean condition",
        explanation: "When this variable is boolean, comparing it strictly with true is redundant.",
        before: line,
        after: `${match[1]}${match[2]}${match[3]}`,
      });
    });
  }

  return suggestions.slice(0, 20);
};
