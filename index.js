#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const dirColor = "\x1b[34m"; // Blue
const resetColor = "\x1b[0m"; // Reset to default terminal color
const linkColor = "\x1b[36m"; // Cyan

const args = process.argv.slice(2);
const helpFlagIndex = args.findIndex((arg) => arg === "--help" || arg === "-h");
const fancyFlagIndex = args.findIndex((arg) => arg === "--fancy");
const ignorePatternIndex = args.findIndex((arg) => arg.startsWith("--ignore="));

if (helpFlagIndex !== -1) {
  console.log("Usage: node index.js [--fancy] [--ignore=PATTERN]");
  console.log("  --fancy             Output in a stylized markdown format.");
  console.log("  --ignore=PATTERN    Glob pattern to ignore files or directories.");
  console.log("  -h, --help          Print this help message and exit.");
  process.exit();
}

const fancy = fancyFlagIndex !== -1;
const ignorePattern =
  ignorePatternIndex !== -1 ? new RegExp(args[ignorePatternIndex].split("=")[1]) : null;

function getDirectoryStructure(dir, level = 0, prefix = "") {
  let result = [];
  const files = fs.readdirSync(dir).sort();

  files.forEach((file, index) => {
    if (file === "." || file === ".." || (ignorePattern && ignorePattern.test(file))) {
      return;
    }

    const filePath = path.join(dir, file);
    const stats = fs.lstatSync(filePath);
    const isLast = index === files.length - 1;
    let linePrefix = prefix + (fancy ? (isLast ? "└── " : "├── ") : "- ");

    if (stats.isSymbolicLink()) {
      result.push(`${linePrefix}${linkColor}${file}${resetColor} [symbolic link]`);
    } else if (stats.isDirectory()) {
      result.push(`${linePrefix}${dirColor}${file}${resetColor}/`);
      result.push(
        ...getDirectoryStructure(
          filePath,
          level + 1,
          prefix + (fancy ? (isLast ? "    " : "│   ") : "    ")
        )
      );
    } else {
      result.push(`${linePrefix}${file}`);
    }
  });

  return result;
}

const output = getDirectoryStructure(".").join("\n");
console.log(output);
