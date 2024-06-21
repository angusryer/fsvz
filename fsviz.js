#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const dirColor = "\x1b[34m"; // Blue
const resetColor = "\x1b[0m"; // Reset to default terminal color
const linkColor = "\x1b[36m"; // Cyan

const args = process.argv.slice(2);
const helpFlagIndex = args.findIndex((arg) => arg === "--help" || arg === "-h");
const versionFlagIndex = args.findIndex((arg) => arg === "--version" || arg === "-v");
const fancyFlagIndex = args.findIndex((arg) => arg === "--fancy" || arg === "-f");
const dirsOnlyFlagIndex = args.findIndex((arg) => arg === "--dirs-only" || arg === "-d");
const ignorePatternIndex = args.findIndex((arg) => arg.startsWith("--ignore="));
const toFileFlagIndex = args.findIndex((arg) => arg === "--to-file" || arg === "-o");

if (versionFlagIndex !== -1) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
    console.log(packageJson.version);
  } catch (error) {
    console.error("Error reading version:", error.message);
  }
  process.exit();
}

if (helpFlagIndex !== -1) {
  console.log("Usage: node index.js [options] [--ignore=PATTERN]");
  console.log("  --fancy, -f            Output in a stylized markdown format.");
  console.log("  --dirs-only, -d        Output directories only.");
  console.log("  --ignore=PATTERN       Glob pattern to ignore files or directories.");
  console.log(
    "  --to-file, -o          Output to file instead of the console. The file name will be `dirtree.md`. This will be overwritten if it already exists."
  );
  console.log("  --help, -h             Print this help message and exit.");
  process.exit();
}

const fancy = fancyFlagIndex !== -1;
const ignorePattern =
  ignorePatternIndex !== -1 ? new RegExp(args[ignorePatternIndex].split("=")[1]) : null;
const dirsOnly = dirsOnlyFlagIndex !== -1;
const toFile = toFileFlagIndex !== -1;

function getDirectoryStructure(dir, level = 0, prefix = "") {
  let result = [];
  let files;
  try {
    files = fs.readdirSync(dir).sort();
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
    return result;
  }

  files.forEach((file, index) => {
    if (file === "." || file === ".." || (ignorePattern && ignorePattern.test(file))) {
      return;
    }

    const filePath = path.join(dir, file);
    let stats;
    try {
      stats = fs.lstatSync(filePath);
    } catch (error) {
      console.error(`Error reading file ${filePath}: ${error.message}`);
      return;
    }

    const isLast = index === files.length - 1;
    let linePrefix = prefix + (fancy ? (isLast ? "└── " : "├── ") : "- ");

    if (dirsOnly && !stats.isDirectory()) {
      return;
    }

    if (stats.isSymbolicLink()) {
      let targetPath;
      try {
        targetPath = fs.readlinkSync(filePath);
      } catch (error) {
        targetPath = "unresolved";
      }
      result.push(`${linePrefix}${linkColor}${file}${resetColor} [symbolic link -> ${targetPath}]`);
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

if (toFile) {
  const fileName = "dirtree.md";
  try {
    fs.writeFileSync(fileName, output);
    console.log(`Output written to ${fileName}`);
  } catch (error) {
    console.error(`Error writing to file ${fileName}: ${error.message}`);
  }
} else {
  console.log(output);
}
