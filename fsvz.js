#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const mm = require("micromatch");

// ANSI color codes
const dirColor = "\x1b[34m"; // Blue
const resetColor = "\x1b[0m"; // Reset
const linkColor = "\x1b[36m"; // Cyan

function printHelp() {
  const options = [
    {
      flag: "--simple, -s",
      description: "Output in a simple format using dashes (default is ASCII lines).",
    },
    { flag: "--dirs-only, -d", description: "Output directories only." },
    {
      flag: "--ignore=PATTERNS, -i PATTERNS",
      description: "Comma- or pipe-separated glob patterns to ignore files and/or directories.",
    },
    {
      flag: "--raw=FILENAME, -r FILENAME",
      description:
        "Output to file instead of the console. Overwrites existing file of the same name.",
    },
    {
      flag: "--json=FILENAME, -j FILENAME",
      description:
        "Output in JSON format. Overwrites existing file of the same name. Cannot be used with --csv.",
    },
    {
      flag: "--csv=FILENAME, -c FILENAME",
      description:
        "Output in CSV format. Overwrites existing file of the same name. Cannot be used with --json.",
    },
    { flag: "--help, -h", description: "Print this help message and exit." },
    { flag: "--version, -v", description: "Print the version and exit." },
  ];

  const maxFlagLength = Math.max(...options.map((opt) => opt.flag.length));
  console.log("Usage: fsvz [path] [options]\n");
  options.forEach((opt) => {
    const padding = " ".repeat(maxFlagLength - opt.flag.length + 2);
    console.log(`  ${opt.flag}${padding}${opt.description}`);
  });
}

function getNextArg(index, args) {
  const nextArg = args[index + 1];
  return nextArg && !nextArg.startsWith("-") ? nextArg : null;
}

function getOptions(args) {
  const options = {
    simple: false,
    dirsOnly: false,
    rawOutput: undefined,
    jsonOutput: undefined,
    csvOutput: undefined,
    ignorePatterns: [],
    path: ".",
  };

  // Check if the first argument is a path
  if (args.length > 0 && !args[0].startsWith("-")) {
    options.path = args[0];
    args = args.slice(1);
  }

  // Parse arguments
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
        if (!options.rawOutput) {
          console.error("Please provide a filename for the raw output.");
          process.exit(1);
        }
        i++;
        break;
      case "--json":
      case "-j":
        options.jsonOutput = getNextArg(i, args);
        if (!options.jsonOutput) {
          console.error("Please provide a filename for the JSON output.");
          process.exit(1);
        }
        i++;
        break;
      case "--csv":
      case "-c":
        options.csvOutput = getNextArg(i, args);
        if (!options.csvOutput) {
          console.error("Please provide a filename for the CSV output.");
          process.exit(1);
        }
        i++;
        break;
      case "--ignore":
      case "-i":
        const patternArg = getNextArg(i, args);
        if (!patternArg) {
          console.error("Please provide a pattern to ignore.");
          process.exit(1);
        }
        const patterns = patternArg
          .split(/[,|]/)
          .map((p) => p.trim())
          .filter(Boolean);
        for (const pattern of patterns) {
          try {
            mm.makeRe(pattern, { failglob: true, strictBrackets: true }); // If it can't be made into a regex, then it should fail
            options.ignorePatterns.push(pattern);
          } catch (error) {
            console.error(`Invalid pattern: ${error.message}`);
            process.exit(1);
          }
        }
        i++;
        break;
      default:
        if (arg.startsWith("--ignore=")) {
          const pattern = arg.substring("--ignore=".length);
          if (!pattern) {
            console.error("Please provide a pattern to ignore.");
            process.exit(1);
          }
          const patterns = pattern
            .split(/[,|]/)
            .map((p) => p.trim())
            .filter(Boolean);
          mm.makeRe(pattern, { failglob: true, strictBrackets: true }); // If it can't be made into a regex, then it should fail
          options.ignorePatterns.push(...patterns);
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  // Ensure mutually exclusive options are not both used
  if (options.jsonOutput && options.csvOutput) {
    console.error("You may only specify one of --json or --csv.");
    process.exit(1);
  }

  return options;
}

function stripAnsiCodes(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function convertToCSV(data) {
  const fields = ["path", "name", "type", "target"];
  const replacer = (_key, value) => (value === null || value === undefined ? "" : value);
  const csv = data.map((row) =>
    fields.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(",")
  );
  csv.unshift(fields.join(","));
  return csv.join("\n");
}

function flattenStructure(structure) {
  let result = [];
  let stack = [...structure];

  while (stack.length > 0) {
    let item = stack.pop();
    result.push(item);
    if (item.type === "directory" && item.children) {
      stack.push(
        ...item.children.map((child) => ({ ...child, path: path.join(item.path, child.name) }))
      );
    }
  }

  return result;
}

function getIsLast(items, i) {
  return items.length === 1 ? true : i === items.length - 1;
}

function formatStructure(items, options) {
  let result = [];
  let stack = [];

  // Initialize the stack with the root level items in reverse order
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const isLast = getIsLast(items, i); // Determines if the item is the last among siblings
    stack.push({
      item,
      prefixes: [],
      isLast: isLast,
    });
  }

  while (stack.length > 0) {
    const { item, prefixes, isLast } = stack.pop();

    // Build the line prefix
    let linePrefix = "";
    for (const prefix of prefixes) {
      if (options.simple) {
        linePrefix += "-";
      } else {
        linePrefix += prefix ? "│  " : "   ";
      }
    }

    let prefixType = options.simple ? "- " : isLast ? "└─ " : "├─ ";
    linePrefix += prefixType;

    let line;
    switch (item.type) {
      case "directory":
        line = `${linePrefix}${dirColor}${item.name}/${resetColor}`;
        break;
      case "file":
        line = `${linePrefix}${item.name}`;
        break;
      case "symbolic link":
        line = `${linePrefix}${item.name} ${linkColor}[link -> ${item.target}]${resetColor}`;
        break;
      default:
        line = `${linePrefix}${item.name}`;
    }

    result.push(line);

    if (item.type === "directory" && item.children && item.children.length > 0) {
      const children = item.children;

      // Process children in reverse order to maintain correct output order
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const childIsLast = getIsLast(children, i);
        stack.push({
          item: child,
          prefixes: [...prefixes, !isLast],
          isLast: childIsLast,
        });
      }
    }
  }

  return result;
}

function getDirectoryStructure(rootDir, options) {
  let result = [];
  let stack = [{ dir: rootDir, parent: null }];

  while (stack.length > 0) {
    const { dir, parent } = stack.pop();
    let entries;

    try {
      if (!fs.existsSync(dir)) {
        continue;
      }
      
      entries = fs.readdirSync(dir).sort();
    } catch (error) {
      console.error(`Error reading directory ${dir}: ${error.message}`);
      continue;
    }

    let dirItems = [];
    let fileItems = [];

    entries.forEach((entry) => {
      if (entry === "." || entry === "..") return;

      const entryPath = path.join(dir, entry);
      const relativePath = path.relative(options?.path ?? rootDir, entryPath);

      if (
        options.ignorePatterns &&
        options.ignorePatterns.length > 0 &&
        mm.isMatch(relativePath, options.ignorePatterns, { matchBase: true })
      ) {
        return;
      }

      let stats;

      try {
        stats = fs.lstatSync(entryPath);
      } catch (error) {
        console.error(`Error reading file ${entryPath}: ${error.message}`);
        return;
      }

      if (options.dirsOnly && !stats.isDirectory()) return;

      let item = {
        name: entry,
        path: entryPath,
      };

      if (stats.isSymbolicLink()) {
        let targetPath;
        try {
          targetPath = fs.readlinkSync(entryPath);
        } catch (error) {
          targetPath = "unresolved";
        }
        item.type = "symbolic link";
        item.target = targetPath;
        fileItems.push(item); // Treat symbolic links as files
      } else if (stats.isDirectory()) {
        item.type = "directory";
        item.children = [];
        dirItems.push(item);
        // Push the directory onto the stack to process its contents later
        stack.push({ dir: entryPath, parent: item });
      } else {
        item.type = "file";
        fileItems.push(item);
      }
    });

    // Combine directories and files, directories first
    const items = dirItems.concat(fileItems);

    if (parent) {
      parent.children = parent.children || [];
      parent.children.push(...items);
    } else {
      result.push(...items);
    }
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
    options.jsonOutput = options.jsonOutput.endsWith(".json")
      ? options.jsonOutput
      : options.jsonOutput + ".json";
    fs.writeFileSync(options.jsonOutput, output);
  } else if (options.csvOutput) {
    const flattenedStructure = flattenStructure(structure);
    output = convertToCSV(flattenedStructure);
    options.csvOutput = options.csvOutput.endsWith(".csv")
      ? options.csvOutput
      : options.csvOutput + ".csv";
    fs.writeFileSync(options.csvOutput, output);
  } else if (options.rawOutput) {
    const lines = formatStructure(structure, options);
    output = lines.join("\n");
    fs.writeFileSync(options.rawOutput, stripAnsiCodes(output));
  } else {
    const lines = formatStructure(structure, options);
    output = lines.join("\n");
    console.log(output);
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = {
    main,
    getOptions,
    globToRegex: mm.makeRe,
    getDirectoryStructure,
    formatStructure,
    flattenStructure,
    convertToCSV,
    stripAnsiCodes,
  };
}
