/*
 * ============================================================
 * File Name     : seedContent.js
 * Description   : Seeds an initial C, C++, Java, and JavaScript curriculum.
 * Module        : Starter Curriculum
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import LearningItem from "../models/LearningItem.js";

const curricula = [
  {
    key: "c", title: "C", description: "Build strong foundations with procedural programming and memory-aware thinking.",
    topic: "C fundamentals", topicSlug: "c-fundamentals", lesson: "Your first C program", lessonSlug: "c-first-program", note: "C quick reference", question: "Add two integers",
    code: "#include <stdio.h>\n\nint main(void) {\n    int first, second;\n    scanf(\"%d %d\", &first, &second);\n    printf(\"%d\\n\", first + second);\n    return 0;\n}",
    body: "A C program starts in main. Include standard libraries before using their functions. scanf reads values into variables, and printf writes output. Every statement ends with a semicolon.\n\nTry changing the input values and trace the two variables before the addition.",
    noteBody: "# C starter notes\n\n- `#include <stdio.h>` provides standard input and output functions.\n- `int main(void)` is the program entry point.\n- Use `scanf` to read and `printf` to write.\n- C statements usually end with a semicolon.",
  },
  {
    key: "cpp", title: "C++", description: "Learn expressive systems programming, standard libraries, and problem solving.",
    topic: "C++ fundamentals", topicSlug: "cpp-fundamentals", lesson: "Input, output, and variables", lessonSlug: "cpp-input-output", note: "C++ quick reference", question: "Add two integers",
    code: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int first, second;\n    cin >> first >> second;\n    cout << first + second << '\\n';\n}",
    body: "C++ begins execution at main. The iostream library provides cin and cout. Use the extraction operator to read values and the insertion operator to print them.\n\nTrace the values after input and before output to see how the expression is evaluated.",
    noteBody: "# C++ starter notes\n\n- `#include <iostream>` provides `cin` and `cout`.\n- `int main()` is the program entry point.\n- `cin >> value` reads input.\n- `cout << value` writes output.",
  },
  {
    key: "java", title: "Java", description: "Practice object-oriented programming with a reliable, strongly typed language.",
    topic: "Java fundamentals", topicSlug: "java-fundamentals", lesson: "Your first Java class", lessonSlug: "java-first-class", note: "Java quick reference", question: "Add two integers",
    code: "import java.util.Scanner;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        int first = input.nextInt();\n        int second = input.nextInt();\n        System.out.println(first + second);\n    }\n}",
    body: "Java code lives inside a class. The main method is where a program starts. Declare variable types explicitly, create a Scanner to read input, and use System.out.println to print a line.\n\nThe class name Main is used by many online practice runners.",
    noteBody: "# Java starter notes\n\n- Programs define classes and methods.\n- `public static void main(String[] args)` is the entry point.\n- Declare a type, such as `int`, before each variable.\n- `Scanner` reads input; `System.out.println` prints a line.",
  },
  {
    key: "javascript", title: "JavaScript", description: "Use a flexible language for browser interfaces, servers, and algorithms.",
    topic: "JavaScript fundamentals", topicSlug: "javascript-fundamentals", lesson: "Values, variables, and output", lessonSlug: "javascript-values-output", note: "JavaScript quick reference", question: "Add two integers",
    code: "const fs = require('fs');\nconst [first, second] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(first + second);",
    body: "JavaScript can run in a browser or a server-side runtime. Use const for bindings that will not be reassigned and let for values that change. Read input from the environment provided by the runner and print the result with console.log.\n\nIn a browser, JavaScript can also respond to events and update the page.",
    noteBody: "# JavaScript starter notes\n\n- Use `const` for bindings you do not reassign and `let` for changing values.\n- `console.log` prints output.\n- JavaScript values have runtime types.\n- In Node.js practice programs, read stdin with the `fs` module.",
  },
];

/*
 * ============================================================
 * Function Name : seedStarterContent
 * Description   : Inserts starter learning material without overwriting edits.
 * Input         : Active Mongoose database connection.
 * Output        : A persisted starter curriculum for all four languages.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const seedStarterContent = async () => {
  for (const curriculum of curricula) {
    const language = await LearningItem.findOneAndUpdate(
      { kind: "language", slug: curriculum.key },
      { $setOnInsert: { kind: "language", slug: curriculum.key, title: curriculum.title, description: curriculum.description, language: curriculum.key, published: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const topic = await LearningItem.findOneAndUpdate(
      { kind: "topic", slug: curriculum.topicSlug },
      { $setOnInsert: { kind: "topic", slug: curriculum.topicSlug, title: curriculum.topic, description: `Start learning the core concepts of ${curriculum.title}.`, language: curriculum.key, parent: language._id, published: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await LearningItem.findOneAndUpdate(
      { kind: "lesson", slug: curriculum.lessonSlug },
      { $setOnInsert: { kind: "lesson", slug: curriculum.lessonSlug, title: curriculum.lesson, description: `A first hands-on ${curriculum.title} lesson.`, body: curriculum.body, language: curriculum.key, parent: topic._id, order: 1, examples: [{ title: "Read two numbers and print their sum", input: "2 3", output: "5", explanation: "The program reads two values, adds them, then prints the result." }], published: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await LearningItem.findOneAndUpdate(
      { kind: "note", slug: `${curriculum.key}-quick-reference` },
      { $setOnInsert: { kind: "note", slug: `${curriculum.key}-quick-reference`, title: curriculum.note, description: `Syntax and concepts to keep nearby while learning ${curriculum.title}.`, body: curriculum.noteBody, language: curriculum.key, parent: topic._id, published: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await LearningItem.findOneAndUpdate(
      { kind: "question", slug: `${curriculum.key}-sum-two-integers` },
      {
        $setOnInsert: {
          kind: "question", slug: `${curriculum.key}-sum-two-integers`, title: curriculum.question,
          description: "Read two integers from standard input and print their sum on one line.",
          body: "The input contains two space-separated integers. Print exactly one integer: their sum.",
          language: curriculum.key, parent: topic._id, difficulty: "easy", order: 1,
          constraints: ["The input contains exactly two integers.", "Each integer fits in a signed 32-bit value."],
          hints: ["Read both values before printing.", "Add the two values and print the result on its own line."],
          examples: [{ title: "Sample", input: "2 3", output: "5", explanation: "2 + 3 = 5." }],
          testCases: [{ input: "2 3", expectedOutput: "5", isHidden: false }, { input: "-4 9", expectedOutput: "5", isHidden: true }, { input: "0 0", expectedOutput: "0", isHidden: true }],
          published: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

export default seedStarterContent;
