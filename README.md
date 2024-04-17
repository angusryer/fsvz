# fsviz - Directory Structure CLI Tool

fsviz is a lightweight, dependency-free command-line tool built with Node.js for generating and displaying the directory structure of your current folder. It's designed to be simple and easy to use.

## Features

- **No External Dependencies**: Built purely with Node.js built-in modules.
- **Customizable Output**: Choose between simple and fancy tree-like outputs.
- **Pattern Ignoring**: Ability to ignore files and directories based on a provided glob pattern.

## Installation

You can install fsviz globally using npm by running the following command:

```bash
npm install -g fsviz
```

This allows you to use the `fsviz` command from anywhere on your system.

## Usage

After installation, you can use the `fsviz` command in your terminal. Here are some ways to use this tool:

### Basic Usage

To display the directory structure of the current directory, simply type:

```bash
fsviz
```

### Fancy Output

For a more graphical tree-like structure, use the `--fancy` option:

```bash
fsviz --fancy
```

### Ignoring Patterns

To ignore files or directories that match a certain pattern, use the `--ignore` option. For example, to ignore all node_modules directories, you can run:

```bash
fsviz --ignore="node_modules"
```

### Help

For more information on all available options, use the help command:

```bash
fsviz --help
```

## Example Output

Here is an example of what the fancy output might look like:

```
fsviz-project
├── node_modules
│   └── (contents ignored)
├── src
│   ├── index.js
│   └── utils.js
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have feedback, requests, or bugs to report.

## License

fsviz is [MIT licensed](./LICENSE).
