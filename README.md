# fsvz - Directory Structure Mapping and Visualization CLI Tool

fsvz is a lightweight command-line tool built with Node.js for generating and displaying directory structures. It’s designed to be simple, efficient, and easy to use.

## TODOs

- Add a screenshot or a GIF of it working in the README.

## Features

- Efficient Directory Traversal: Quickly generate the directory structure of large projects.
- Customizable Output:
  - Choose between simple (-s) and fancy tree-like console outputs.
  - Export the directory structure to JSON (--json) or CSV (--csv) formats.
- Pattern Ignoring: Ignore files and directories based on glob patterns using the powerful micromatch library.
- Directory-Only Mode: Option to display only directories using the --dirs-only or -d flag.
- Symbolic Links Handling: Recognizes and displays symbolic links.

## Installation

You can install fsvz globally using npm by running the following command:

```npm install -g fsvz```

This allows you to use the fsvz command from anywhere on your system.

## Usage

After installation, you can use the fsvz command in your terminal. Here are some ways to use this tool:

### Basic Usage

To display the directory structure of the current directory, simply type:

```fsvz```

*NOTE:* For deeply nested hierarchies, it may take some time to display the entire structure. Although it’s optimized for performance, extremely large directories may still take longer to process. If you run into any issues, please let me know by opening an issue.

### Fancy and Simple Outputs to the CLI

By default, fsvz outputs a fancy tree-like structure using ASCII characters. For a simpler output that uses dashes, use the --simple or -s option:

```
fsvz --simple
fsvz -s
```

### Output to JSON or CSV, or to a File in “raw” Format

To output the directory structure as JSON or CSV, use the --json or --csv options:

```
fsvz --json mytree.json   # Outputs the tree structure to a JSON file. You can also use the -j shorthand.
fsvz --csv mytree.csv     # Outputs the tree structure to a CSV file. You can also use the -c shorthand.
```

To output the raw tree structure to a file (just as it would be displayed in the terminal), use the --raw option:

```
fsvz --raw mytree.txt     # Outputs the raw tree structure to a text file.
```

### Ignoring Patterns

To ignore files or directories that match glob patterns, use the --ignore or -i option. The pattern matching is powered by micromatch, which supports advanced glob patterns.

For example, to ignore all node_modules directories, you can run:

```fsvz --ignore="node_modules"```

To ignore all files with the .js extension, you can run:

```fsvz -i "*.js"```

To ignore multiple patterns, you can separate them with commas or pipes:

```
fsvz --ignore="node_modules,*.js"
fsvz -i "node_modules|*.js"
```

These patterns are applied recursively, so any matching files or directories at any level in the directory tree will be ignored.

### Directory-Only Mode

If you want to display only directories and exclude files from the output, use the --dirs-only or -d option:

```fsvz --dirs-only```

### Handling Symbolic Links

fsvz recognizes symbolic links and displays them with an indicator

Example output:

```
├─ src/
│  ├─ index.js
│  └─ utils.js
├─ lib/ [link -> ../shared/lib]
└─ README.md
```

### Help

For more information on all available options, use the help command:

```
fsvz --help
fsvz -h
```
---

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have feedback, requests, or bugs to report.

## License

fsvz is MIT licensed.
