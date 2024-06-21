#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parse } = require("json2csv");

const dirColor = "\x1b[34m"; // Blue
const resetColor = "\x1b[0m"; // Reset to default terminal color
const linkColor = "\x1b[36m"; // Cyan

function main() {
  const args = process.argv.slice(2);
  const helpFlagIndex = args.findIndex((arg) => arg === "--help" || arg === "-h");
  const versionFlagIndex = args.findIndex((arg) => arg === "--version" || arg === "-v");
  const fancyFlagIndex = args.findIndex((arg) => arg === "--fancy" || arg === "-f");
  const dirsOnlyFlagIndex = args.findIndex((arg) => arg === "--dirs-only" || arg === "-d");
  const ignorePatternIndex = args.findIndex((arg) => arg.startsWith("--ignore="));
  const toFileFlagIndex = args.findIndex((arg) => arg === "--to-file" || arg === "-o");
  const jsonFlagIndex = args.findIndex((arg) => arg === "--json");
  const csvFlagIndex = args.findIndex((arg) => arg === "--csv");

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
    console.log("  --fancy, -f            Output in a stylized markdown format (default).");
    console.log("  --dirs-only, -d        Output directories only.");
    console.log("  --ignore=PATTERN       Glob pattern to ignore files or directories.");
    console.log(
      "  --to-file, -o FILENAME Output to file instead of the console. The file will be overwritten if it already exists."
    );
    console.log("  --json                 Output in JSON format.");
    console.log("  --csv                  Output in CSV format.");
    console.log("  --help, -h             Print this help message and exit.");
    process.exit();
  }

  const fancy = fancyFlagIndex !== -1 || (helpFlagIndex === -1 && versionFlagIndex === -1);
  const ignorePattern =
    ignorePatternIndex !== -1 ? new RegExp(args[ignorePatternIndex].split("=")[1]) : null;
  const dirsOnly = dirsOnlyFlagIndex !== -1;
  const toFile = toFileFlagIndex !== -1 ? args[toFileFlagIndex + 1] : null;
  const jsonOutput = jsonFlagIndex !== -1;
  const csvOutput = csvFlagIndex !== -1;

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
      if (file === "." || file === ".." || ignorePattern?.test(file)) {
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
      const lastSymbol = isLast ? "└── " : "├── ";
      let linePrefix = prefix + (fancy ? lastSymbol : "- ");

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
        result.push({
          name: file,
          type: "symbolic link",
          target: targetPath,
          display: `${linePrefix}${linkColor}${file}${resetColor} [symbolic link -> ${targetPath}]`,
        });
      } else if (stats.isDirectory()) {
        result.push({
          name: file,
          type: "directory",
          display: `${linePrefix}${dirColor}${file}${resetColor}/`,
        });
        const lastSymbol = isLast ? "    " : "│   ";
        result.push(
          ...getDirectoryStructure(filePath, level + 1, prefix + (fancy ? lastSymbol : "    "))
        );
      } else {
        result.push({
          name: file,
          type: "file",
          display: `${linePrefix}${file}`,
        });
      }
    });

    return result;
  }

  const structure = getDirectoryStructure(".");
  let output;

  if (jsonOutput) {
    output = JSON.stringify(structure, null, 2);
  } else if (csvOutput) {
    const fields = ["name", "type", "target"];
    try {
      output = parse(structure, { fields });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else {
    output = structure.map((item) => item.display).join("\n");
  }

  if (toFile) {
    try {
      fs.writeFileSync(toFile, output);
      console.log(`Output written to ${toFile}`);
    } catch (error) {
      console.error(`Error writing to file ${toFile}: ${error.message}`);
    }
  } else {
    console.log(output);
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = main;
}
