# fsvz - Directory Structure CLI Tool

fsvz is a lightweight, dependency-free command-line tool built with Node.js for generating and displaying directory structures. It's designed to be simple and easy to use.

## TODOs

- add screenshot or a gif of it working in the README

## Features

- **No External Dependencies**: Built purely with Node.js built-in modules.
- **Customizable Output**: Choose between simple and fancy tree-like outputs. Fancy is default.
- **Pattern Ignoring**: Ability to ignore files and directories based on a provided glob pattern.
- **JSON & CSV Output**: Export the directory/file structure as JSON or CSV.

## Installation

You can install fsvz globally using npm by running the following command:

```bash
npm install -g fsvz
```

This allows you to use the `fsvz` command from anywhere on your system.

## Usage

After installation, you can use the `fsvz` command in your terminal. Here are some ways to use this tool:

### Basic Usage

To display the directory structure of the current directory, simply type:

```bash
fsvz
```

### Fancy Output

For a more graphical tree-like structure, use the `--fancy` option:

```bash
fsvz --fancy
```

### Ignoring Patterns

To ignore files or directories that match glob patterns, use the `--ignore` or `-i` options. For example, to ignore all node_modules directories, you can run:

```bash
fsvz --ignore="node_modules"
```

Or to ignore all files with the `.js` extension, you can run:

```bash
fsvz -i "*.js"
```

Or to ignore multiple patterns, you can separate them with commas or standard glob pattern syntax:

```bash
fsvz --ignore="node_modules,*.js"
fsivz -i "{node_modules|*.js}"
```

### Help

For more information on all available options, use the help command:

```bash
fsvz --help
```

## Example Output

Here is an example of what the default output might look like:

```
fsvz-project
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

fsvz is [MIT licensed](./LICENSE).
