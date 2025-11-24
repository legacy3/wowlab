import chalk from "chalk";
import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import PrettyError from "pretty-error";
import * as StackTraceParser from "stacktrace-parser";

// Force color support for WSL and other terminals
process.env.FORCE_COLOR = "3";

// Constants for consistent formatting
const SEPARATOR_WIDTH = 80;
const INDENT = "    ";

// Initialize pretty-error for formatting JavaScript stack traces
const prettyError = new PrettyError();
prettyError.skipNodeFiles();
prettyError.skipPackage("effect");

const colorizeErrorMessage = (line: string): string => {
  const errorMatch = line.match(/^(\([^)]+\))\s+(.*?):\s+(.*)$/);
  if (!errorMatch) {
    return line;
  }

  const [, type, errorName, message] = errorMatch;

  return [
    chalk.gray(type),
    chalk.red.bold(errorName) + ":",
    chalk.white(message),
  ].join(" ");
};

const colorizeStackFrame = (frame: StackTraceParser.StackFrame): string => {
  const method = frame.methodName || "<anonymous>";
  const file = frame.file || "";

  if (!file) {
    return INDENT + chalk.gray("at ") + chalk.cyan(method);
  }

  const location = frame.column
    ? `${file}:${frame.lineNumber}:${frame.column}`
    : `${file}:${frame.lineNumber}`;

  return [
    INDENT + chalk.gray("at "),
    chalk.cyan(method),
    chalk.gray("(") + chalk.yellow(location) + chalk.gray(")"),
  ].join(" ");
};

const colorizeStackTrace = (stackTrace: string): string => {
  const lines = stackTrace.split("\n");
  const [firstLine, ...restLines] = lines;

  const colorizedMessage = colorizeErrorMessage(firstLine);
  const frames = StackTraceParser.parse(restLines.join("\n"));
  const colorizedFrames = frames.map(colorizeStackFrame).join("\n");

  return colorizedMessage + "\n" + colorizedFrames;
};

export const printFormattedError = (
  exit: Exit.Exit<unknown, unknown>,
): void => {
  if (!Exit.isFailure(exit)) {
    return;
  }

  const separator = chalk.red.bold("=".repeat(SEPARATOR_WIDTH));
  const divider = chalk.gray("-".repeat(SEPARATOR_WIDTH));

  // Header
  console.error(`\n${separator}`);
  console.error(chalk.red.bold("ERROR DETAILS"));
  console.error(`${separator}\n`);

  // Effect Cause section
  console.error(chalk.yellow.bold("Effect Cause:"));
  const causeOutput = Cause.pretty(exit.cause);
  console.error(colorizeStackTrace(causeOutput));

  // Defects section (if any)
  const defects = Cause.defects(exit.cause);
  if (defects.length > 0) {
    console.error(`\n${divider}\n`);
    console.error(chalk.cyan.bold("Defects:"));

    for (const defect of defects) {
      if (defect instanceof Error) {
        console.error(prettyError.render(defect));
      } else {
        console.error(chalk.red(String(defect)));
      }
    }
  }

  // Footer
  console.error(`\n${separator}\n`);
};
