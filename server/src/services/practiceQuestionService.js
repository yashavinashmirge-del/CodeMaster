/*
 * ============================================================
 * File Name     : practiceQuestionService.js
 * Description   : Generates safe, structured coding challenges.
 * Module        : AI Code Practice
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { getAiProviderConfig } from "./aiProviderConfig.js";

const fallbackProblems = {
  any: [
    {
      title: "Count the even values",
      description: "Read a count followed by that many integers. Print how many values are even.",
      body: "Read n, then n integers. Count values divisible by 2 and print the count.",
      examples: [{ input: "5\n2 7 4 9 6", output: "3", explanation: "Three values are divisible by 2." }],
      constraints: ["1 ≤ n ≤ 1000", "Each value is between -10,000 and 10,000."],
      hints: ["Keep a counter that starts at zero.", "For each value, check whether the remainder after division by 2 is zero."],
    },
    {
      title: "Find the largest number",
      description: "Read a count followed by that many integers. Print the largest value.",
      body: "The first input is n. The next n integers form the list. Output the largest integer on one line.",
      examples: [{ input: "5\n-4 12 3 8 1", output: "12", explanation: "12 is the greatest value in the list." }],
      constraints: ["1 ≤ n ≤ 1000", "Each value is between -1,000,000 and 1,000,000."],
      hints: ["Use the first list value as the initial largest value.", "Compare each remaining value with the largest so far."],
    },
    {
      title: "Reverse a word",
      description: "Read one word and print its characters in reverse order.",
      body: "The input contains a single word made of English letters. Print the word backwards.",
      examples: [{ input: "coding", output: "gnidoc", explanation: "The characters appear from last to first." }],
      constraints: ["The word contains 1 to 200 characters."],
      hints: ["The last character becomes the first output character.", "Move an index from the end of the word toward its beginning."],
    },
    {
      title: "Sum from one to n",
      description: "Read a positive integer n and print the sum of every integer from 1 through n.",
      body: "Given n, calculate 1 + 2 + … + n and print the result.",
      examples: [{ input: "5", output: "15", explanation: "1 + 2 + 3 + 4 + 5 = 15." }],
      constraints: ["1 ≤ n ≤ 1,000,000"],
      hints: ["Start with a sum of zero.", "Visit each integer from 1 to n and add it to the sum."],
    },
  ],
  arrays: [
    {
      title: "Count values above the average",
      description: "Read a list of integers and count how many are strictly greater than the list average.",
      body: "Read n followed by n integers. Compute their arithmetic mean, then print the number of values greater than that mean.",
      examples: [{ input: "4\n2 4 6 8", output: "2", explanation: "The average is 5; only 6 and 8 are greater." }],
      constraints: ["1 ≤ n ≤ 1000", "Each value is between -10,000 and 10,000."],
      hints: ["Read the values into a list and compute their sum first.", "Compare each value with sum divided by n."],
    },
    {
      title: "Remove adjacent duplicates",
      description: "Read a sequence of integers and print it with consecutive repeated values collapsed to one.",
      body: "Read n followed by n integers. Keep the first value in each run of equal neighboring values. Print the remaining values space-separated.",
      examples: [{ input: "7\n1 1 2 2 2 3 1", output: "1 2 3 1", explanation: "Only adjacent repeats are collapsed." }],
      constraints: ["1 ≤ n ≤ 1000"],
      hints: ["Always keep the first value.", "Keep a value only when it differs from the previously kept value."],
    },
  ],
  strings: [
    {
      title: "Count the vowels",
      description: "Read one line and count its English vowels, without distinguishing letter case.",
      body: "Count occurrences of a, e, i, o, and u in the input line. Print the count.",
      examples: [{ input: "Code Master", output: "4", explanation: "The vowels are o, e, a, and e." }],
      constraints: ["The line contains at most 1000 characters."],
      hints: ["Convert each letter to lowercase before comparing.", "Check each character against the five vowels."],
    },
    {
      title: "Check for a palindrome",
      description: "Check whether the given word reads the same forwards and backwards.",
      body: "Read a word. Print YES if it is the same in reverse order; otherwise print NO. Treat uppercase and lowercase as equal.",
      examples: [{ input: "Level", output: "YES", explanation: "Ignoring case, Level is the same in reverse." }],
      constraints: ["The word contains 1 to 200 English letters."],
      hints: ["Compare matching characters from both ends.", "Stop when the indices meet or a pair does not match."],
    },
  ],
  loops: [
    {
      title: "Print a number staircase",
      description: "For a given height n, print rows containing the numbers from 1 up to that row number.",
      body: "Print n lines. Line i contains the integers from 1 to i separated by single spaces.",
      examples: [{ input: "4", output: "1\n1 2\n1 2 3\n1 2 3 4", explanation: "Each row adds the next integer." }],
      constraints: ["1 ≤ n ≤ 30"],
      hints: ["Use an outer loop to select the row.", "Inside it, print values from 1 to the current row number."],
    },
  ],
  conditions: [
    {
      title: "Classify a year",
      description: "Determine whether the given year is a leap year.",
      body: "A year is a leap year when it is divisible by 400, or divisible by 4 but not by 100. Print YES for a leap year and NO otherwise.",
      examples: [{ input: "1900", output: "NO", explanation: "1900 is divisible by 100 but not by 400." }],
      constraints: ["1 ≤ year ≤ 9999"],
      hints: ["Check divisibility by 400 first.", "A year divisible by 100 needs the special 400 check."],
    },
  ],
  input_output: [
    {
      title: "Convert minutes to hours",
      description: "Convert a nonnegative number of minutes to whole hours and remaining minutes.",
      body: "Read total minutes. Print the number of full hours and the remaining minutes, separated by one space.",
      examples: [{ input: "135", output: "2 15", explanation: "135 minutes contains 2 hours and 15 minutes." }],
      constraints: ["0 ≤ minutes ≤ 1,000,000"],
      hints: ["Integer division by 60 gives the full hours.", "The remainder after division by 60 gives the remaining minutes."],
    },
  ],
};

const difficulties = new Set(["easy", "medium", "hard"]);
const topics = new Set(Object.keys(fallbackProblems));
const supportedLanguages = new Set(["c", "cpp", "java", "javascript"]);

/*
 * ============================================================
 * Function Name : validatePracticeQuestion
 * Description   : Keeps generated or provider content within a stable shape.
 * Input         : Untrusted question object from a provider or local bank.
 * Output        : Normalized question, or null when required fields are absent.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const validatePracticeQuestion = (candidate, request) => {
  if (!candidate || typeof candidate !== "object") return null;
  const text = (value, max = 1600) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const title = text(candidate.title, 100);
  const description = text(candidate.description, 400);
  const body = text(candidate.body, 1800);
  const examples = Array.isArray(candidate.examples) ? candidate.examples.slice(0, 2).map((example) => ({
    title: text(example?.title, 80) || "Example",
    input: text(example?.input, 500),
    output: text(example?.output, 500),
    explanation: text(example?.explanation, 250),
  })).filter((example) => example.input && example.output) : [];
  if (!title || !description || !body || !examples.length) return null;
  const constraints = Array.isArray(candidate.constraints) ? candidate.constraints.slice(0, 6).map((item) => text(item, 180)).filter(Boolean) : [];
  const hints = Array.isArray(candidate.hints) ? candidate.hints.slice(0, 3).map((item) => text(item, 220)).filter(Boolean) : [];
  if (!constraints.length || !hints.length) return null;
  return { title, description, body, examples, constraints, hints, difficulty: request.difficulty, language: request.language, topic: request.topic };
};

/*
 * ============================================================
 * Function Name : generatePracticeQuestion
 * Description   : Generates a provider question or selects a local challenge.
 * Input         : Supported language, topic, and difficulty preference.
 * Output        : Validated coding challenge and provider availability flag.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const generatePracticeQuestion = async ({ language, topic, difficulty }) => {
  const request = { language, topic, difficulty };
  if (!supportedLanguages.has(language) || !topics.has(topic) || !difficulties.has(difficulty)) {
    throw new Error("Choose a supported language, topic, and difficulty.");
  }

  const provider = getAiProviderConfig();
  if (provider.configured) {
    const response = await fetch(`${provider.apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Create one original programming practice question as a JSON object with title, description, body, examples (array of input, output, explanation), constraints (array of strings), and hints (array of strings). Calibrate scope to the requested level: easy uses one direct concept, medium combines concepts or edge cases, and hard requires careful algorithm design or optimization. Do not include code solutions, markdown fences, or hidden tests. Make examples and requirements consistent. Return JSON only." },
          { role: "user", content: `Language: ${language}\nTopic: ${topic}\nDifficulty: ${difficulty}\nDo not reveal the solution.` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`The configured AI provider returned HTTP ${response.status}.`);
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    let candidate;
    try { candidate = JSON.parse(content); } catch { throw new Error("The AI provider returned an invalid practice question. Try again."); }
    const question = validatePracticeQuestion(candidate, request);
    if (!question) throw new Error("The AI provider returned an incomplete practice question. Try again.");
    return { question, providerConfigured: true };
  }

  const bank = fallbackProblems[topic];
  const selection = bank[Math.floor(Math.random() * bank.length)];
  const question = validatePracticeQuestion(selection, { ...request, difficulty: "easy" });
  return { question, providerConfigured: false };
};
