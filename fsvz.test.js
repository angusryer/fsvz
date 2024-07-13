describe("globToRegex", () => {
  const { globToRegex } = require("./fsvz");

  test("converts simple glob to regex", () => {
    const regex = globToRegex("*.js");
    expect(regex.test("test.js")).toBe(true); // Positive
    expect(regex.test("example.js")).toBe(true); // Positive
    expect(regex.test("test.txt")).toBe(false); // Negative
    expect(regex.test(".js")).toBe(false); // Negative
  });

  test("handles special characters", () => {
    const regex = globToRegex("file?.js");
    expect(regex.test("file1.js")).toBe(true); // Positive
    expect(regex.test("filea.js")).toBe(true); // Positive
    expect(regex.test("file12.js")).toBe(false); // Negative
    expect(regex.test("file.js")).toBe(false); // Negative
  });

  test("handles multiple patterns", () => {
    const regex = globToRegex("*.js|*.ts");
    expect(regex.test("test.js")).toBe(true); // Positive
    expect(regex.test("example.ts")).toBe(true); // Positive
    expect(regex.test("test.txt")).toBe(false); // Negative
    expect(regex.test("example.jsx")).toBe(false); // Negative
  });

  test("handles dotfiles", () => {
    const regex = globToRegex(".*");
    expect(regex.test(".gitignore")).toBe(true); // Positive
    expect(regex.test(".env")).toBe(true); // Positive
    expect(regex.test("file.txt")).toBe(false); // Negative
    expect(regex.test("anotherfile")).toBe(false); // Negative
  });

  test("handles complex patterns", () => {
    const regex = globToRegex("*.{js,jsx}");
    expect(regex.test("file.js")).toBe(true); // Positive
    expect(regex.test("file.jsx")).toBe(true); // Positive
    expect(regex.test("file.ts")).toBe(false); // Negative
    expect(regex.test("filejs")).toBe(false); // Negative
  });

  test("handles directory patterns", () => {
    const regex = globToRegex("src/**/*.js");
    expect(regex.test("src/components/test.js")).toBe(true); // Positive
    expect(regex.test("src/index.js")).toBe(true); // Positive
    expect(regex.test("src/index.ts")).toBe(false); // Negative
    expect(regex.test("src/test.txt")).toBe(false); // Negative
  });

  test("handles directory patterns (positive cases)", () => {
    const regex = globToRegex("src/**/*.js");
    expect(regex.test("src/components/test.js")).toBe(true); // Positive
    expect(regex.test("src/index.js")).toBe(true); // Positive
    expect(regex.test("src/dir1/dir2/test.js")).toBe(true); // Positive
    expect(regex.test("src/dir1/dir2/dir3/test.js")).toBe(true); // Positive
    expect(regex.test("src/dir1/test.js")).toBe(true); // Positive
    expect(regex.test("src/test.js")).toBe(true); // Positive
    expect(regex.test("src/subdir/file.js")).toBe(true); // Positive
    expect(regex.test("src/anotherdir/anotherfile.js")).toBe(true); // Positive
    expect(regex.test("src/mixedContent123/file.js")).toBe(true); // Positive
    expect(regex.test("src/a/b/c/d/e/f/g/h/i/j/file.js")).toBe(true); // Positive
  });

  test("handles directory patterns (negative cases)", () => {
    const regex = globToRegex("src/**/*.js");
    expect(regex.test("src/index.ts")).toBe(false); // Negative
    expect(regex.test("src/indexjsx")).toBe(false); // Negative
    expect(regex.test("src/components/test.jsx")).toBe(false); // Negative
    expect(regex.test("src/components/test.js.txt")).toBe(false); // Negative
    expect(regex.test("src/dir1/dir2/test.ts")).toBe(false); // Negative
    expect(regex.test("source/components/test.js")).toBe(false); // Negative
    expect(regex.test("srcdir1/dir2/test.js")).toBe(false); // Negative
    expect(regex.test("src2/components/test.js")).toBe(false); // Negative
    expect(regex.test("src/dir1/dir2/")).toBe(false); // Negative (Just a directory, no file)
    expect(regex.test("src/dir1/dir2/testfile")).toBe(false); // Negative (No .js extension)
  });
});

describe("getOptions", () => {
  const getOptions = require("./fsvz").getOptions;

  test("parses simple flags", () => {
    const options = getOptions(["-s", "-d"]);
    expect(options.simple).toBe(true);
    expect(options.dirsOnly).toBe(true);
  });

  test("parses ignore pattern", () => {
    const options = getOptions(["-i", "*.js"]);
    expect(options.ignorePattern.test("test.js")).toBe(true);
    expect(options.ignorePattern.test("test.txt")).toBe(false);
  });

  test("parses ignore pattern with equal sign", () => {
    const options = getOptions(["--ignore=*.js"]);
    expect(options.ignorePattern.test("test.js")).toBe(true);
    expect(options.ignorePattern.test("test.txt")).toBe(false);
  });

  test("handles invalid pattern gracefully", () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    getOptions(["-i", "[invalid"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid pattern"));
    expect(exitSpy).toHaveBeenCalledWith(1);
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test("handles invalid filename gracefully", () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    getOptions(["-r"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Please provide a filename"));
    expect(exitSpy).toHaveBeenCalledWith(1);
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
