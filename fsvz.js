#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const dirColor = "\x1b[34m"; // Blue
const resetColor = "\x1b[0m"; // Reset to default terminal color
const linkColor = "\x1b[36m"; // Cyan

function printHelp() {
  const options = [
    {
      flag: "--simple, -s",
      description:
        "When outputting to the console, do so in a simple format using dashes (ascii lines is default).",
    },
    { flag: "--dirs-only, -d", description: "Exclude files. Output directories only." },
    {
      flag: "--ignore=PATTERN, -i PATTERN",
      description: "Glob pattern to ignore files and/or directories.",
    },
    {
      flag: "--raw=FILENAME, -r FILENAME",
      description:
        "Output to file instead of the console. The file will be overwritten if it already exists.",
    },
    {
      flag: "--json=FILENAME, -j FILENAME",
      description: "Output in JSON format. You may only specify one of --json or --csv.",
    },
    {
      flag: "--csv=FILENAME, -c FILENAME",
      description: "Output in CSV format. You may only specify one of --json or --csv.",
    },
    { flag: "--help, -h", description: "Print this help message and exit." },
    { flag: "--version, -v", description: "Print the version and exit." },
  ];

  const maxFlagLength = Math.max(...options.map((option) => option.flag.length));
  console.log("Usage: fsviz [path] [options]");
  options.forEach((option) => {
    const padding = " ".repeat(maxFlagLength - option.flag.length + 2); // 2 spaces of padding for your eyes to comfortable
    console.log(`  ${option.flag}${padding}${option.description}`);
  });
}

function globToRegex(globString) {
  let _regexWip = "";
  const parts = globString.split("|");

  const regexParts = parts.map((part, index) => {
    let regexPart = "";

    if (index > 0) {
      _regexWip += "|"; // Add an OR operator between each pattern part
    }

    for (let characterIndex = 0; characterIndex < part.length; characterIndex++) {
      const previousCharacter = part[characterIndex - 1];
      const currentCharacter = part[characterIndex];
      const nextCharacter = part[characterIndex + 1];

      switch (currentCharacter) {
        case "/":
          // If the previous character is a '*' and the one before that is also a '*', then skip the escape because
          // it's a globstar that has already been handled below.
          if (previousCharacter === "*" && part[characterIndex - 2] === "*") {
            break;
          }
        case "$":
        case "^":
        case "+":
        case ".":
        case "(":
        case ")":
        case "=":
        case "!":
          regexPart += "\\" + currentCharacter; // in glob, these characters are treated as literals, so escape them
          break;

        case "?":
          regexPart += "."; // . in regex is equivalent to ? in glob
          break;

        case "[":
        case "]":
          regexPart += currentCharacter; // Square brackets are treated as literals in both regex and glob
          break;

        case "{":
          regexPart += "("; // { in glob is equivalent to ( in regex
          break;

        case "}":
          regexPart += ")"; // } in glob is equivalent to ) in regex
          break;

        case ",":
          regexPart += "|"; // , in glob is equivalent to | in regex
          break;

        case "*":
          if (nextCharacter === "*") {
            // we have a globstar!
            regexPart += "(?:[^/]+/)*"; // Match zero or more directories with a trailing slash
            characterIndex += 1; // Skip the next '*'
          } else {
            // this is a single star, so match any character except '/'
            regexPart += "[^/].*";
          }
          break;

        default:
          regexPart += currentCharacter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex special characters as a fallback
      }
    }
    return `^${regexPart}$`; // anchor the start and end of the string
  });

  _regexWip = regexParts.join("|"); // Combine the regex parts into a single regex
  try {
    return new RegExp(_regexWip);
  } catch (error) {
    console.error(`Invalid pattern. Provided glob results in an ${error.message}`);
    process.exit(1);
  }
}

// Helper function to get the next argument if it exists
function getNextArg(index, args) {
  return args?.[index + 1] && !args?.[index + 1]?.startsWith("-") ? args?.[index + 1] : null;
}

function getOptions(args) {
  const options = {
    simple: false,
    dirsOnly: false,
    rawOutput: undefined,
    jsonOutput: undefined,
    csvOutput: undefined,
    ignorePattern: undefined,
    path: ".",
  };

  // Check if the first argument is a path
  if (args.length > 0 && !args[0].startsWith("-")) {
    options.path = args[0];
    args = args.slice(1); // Remove the path from the arguments array
  }

  // Iterate through the arguments and set the options accordingly
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--simple":
      case "-s":
        options.simple = true;
        break;
      case "--dirs-only":
      case "-d":
        options.dirsOnly = true;
        break;
      case "--raw":
      case "-r":
        options.rawOutput = getNextArg(i, args);
        if (options.rawOutput) {
          i++; // Skip the next argument since it is consumed as a value
        } else {
          console.error("Please provide a filename for the raw output.");
          process.exit(1);
        }
        break;
      case "--json":
      case "-j":
        options.jsonOutput = getNextArg(i, args);
        if (options.jsonOutput) {
          i++; // Skip the next argument since it is consumed as an input value to this one
        } else {
          console.error("Please provide a filename for the JSON output.");
          process.exit(1);
        }
        break;
      case "--csv":
      case "-c":
        options.csvOutput = getNextArg(i, args);
        if (options.csvOutput) {
          i++; // Skip the next argument since it is consumed as an input value to this one
        } else {
          console.error("Please provide a filename for the CSV output.");
          process.exit(1);
        }
        break;
      default:
        if (arg.startsWith("--ignore=")) {
          const pattern = arg.split("=")[1];
          options.ignorePattern = globToRegex(pattern);
        } else if (arg === "-i") {
          const pattern = getNextArg(i, args);
          if (pattern) {
            options.ignorePattern = globToRegex(pattern);
            i++;
          }
        }
        break;
    }
  }

  return options;
}

function stripAnsiCodes(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function convertToCSV(data) {
  const fields = ["name", "type", "target"];
  const replacer = (_key, value) => (value === null || value === undefined ? "" : value);
  const csv = data.map((row) =>
    fields.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(",")
  );
  csv.unshift(fields.join(","));
  return csv.join("\n");
}

function formatStructure(structure, options) {
  const formatItem = (item, prefix) => {
    let linePrefix = options.simple ? "- " : prefix;
    switch (item.type) {
      case "directory":
        return `${linePrefix}${dirColor}${item.name}${resetColor}/`;
      case "file":
        return `${linePrefix}${item.name}`;
      case "symbolic link":
        return `${linePrefix}${linkColor}${item.name}${resetColor} [symbolic link -> ${item.target}]`;
      default:
        return `${linePrefix}${item.name}`;
    }
  };

  let result = [];
  let stack = [{ items: structure, prefix: "", level: 0 }];

  while (stack.length > 0) {
    let { items, prefix, level } = stack.pop();

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const lastSymbol = isLast ? "└── " : "├── ";
      result.push(formatItem(item, prefix + (options.simple ? "- " : lastSymbol)));

      if (item.type === "directory" && item.children) {
        const newPrefix = isLast ? "    " : "│   ";
        stack.push({
          items: item.children,
          prefix: prefix + newPrefix,
          level: level + 1,
        });
      }
    });
  }

  return result.join("\n");
}

function flattenStructure(structure) {
  let result = [];
  let stack = [...structure];

  while (stack.length > 0) {
    let item = stack.pop();
    result.push(item);
    if (item.type === "directory" && item.children) {
      stack.push(...item.children);
    }
  }

  return result;
}

function getDirectoryStructure(rootDir, options, maxDepth = 10) {
  let result = [];
  let stack = [{ dir: rootDir, level: 0 }];
  let visitedDirs = new Set();

  while (stack.length > 0) {
    let { dir, level } = stack.pop();

    if (visitedDirs.has(dir)) {
      continue;
    }
    visitedDirs.add(dir);

    if (level > maxDepth) {
      continue;
    }

    let files;
    try {
      if (!fs.existsSync(dir)) {
        continue;
      }
      files = fs.readdirSync(dir).sort();
    } catch (error) {
      console.error(`Error reading directory ${dir}: ${error.message}`);
      continue;
    }

    let children = [];
    files.forEach((file) => {
      if (file === "." || file === ".." || options.ignorePattern?.test(file)) return;

      const filePath = path.join(dir, file);
      let stats;

      try {
        stats = fs.lstatSync(filePath);
      } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
        return;
      }

      if (options.dirsOnly && !stats.isDirectory()) return;

      if (stats.isSymbolicLink()) {
        let targetPath;
        try {
          targetPath = fs.readlinkSync(filePath);
        } catch (error) {
          targetPath = "unresolved";
        }

        children.push({
          name: file,
          type: "symbolic link",
          target: targetPath,
        });
      } else if (stats.isDirectory()) {
        children.push({
          name: file,
          type: "directory",
          children: getDirectoryStructure(filePath, options, maxDepth - 1),
        });
      } else {
        children.push({
          name: file,
          type: "file",
        });
      }
    });

    result = result.concat(children);
  }

  return result;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--version") || args.includes("-v")) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
      console.log(packageJson.version);
    } catch (error) {
      console.error("Error reading version:", error.message);
    }
    return;
  }

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = getOptions(args);

  const structure = getDirectoryStructure(options.path, options);
  let output;

  if (options.jsonOutput) {
    output = JSON.stringify(structure, null, 2);
    if (options.jsonOutput) {
      fs.writeFileSync(
        options.jsonOutput.endsWith(".json") ? options.jsonOutput : options.jsonOutput + ".json",
        stripAnsiCodes(output)
      );
    }
  } else if (options.csvOutput) {
    const flattenedStructure = flattenStructure(structure);
    output = convertToCSV(flattenedStructure);
    if (options.csvOutput) {
      fs.writeFileSync(
        options.csvOutput.endsWith(".csv") ? options.csvOutput : options.csvOutput + ".csv",
        stripAnsiCodes(output)
      );
    }
  } else if (options.rawOutput) {
    output = formatStructure(structure, options);
    fs.writeFileSync(options.rawOutput, stripAnsiCodes(output));
  } else {
    output = formatStructure(structure, options);
    console.log(output);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
} else {
  module.exports = {
    main,
    getOptions,
    globToRegex,
    getDirectoryStructure,
    formatStructure,
    flattenStructure,
    convertToCSV,
    stripAnsiCodes,
  };
}
