import chalk from "chalk";
import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import PrettyError from "pretty-error";

// Force color support for WSL and other terminals
process.env.FORCE_COLOR = "3";

// Initialize pretty-error for formatting JavaScript stack traces
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage("effect");

export const printFormattedError = (
  exit: Exit.Exit<unknown, unknown>,
): void => {
  if (!Exit.isFailure(exit)) {
    return;
  }

  const separator = "=".repeat(80);
  const divider = "-".repeat(80);

  console.error("\n" + chalk.red.bold(separator));
  console.error(chalk.red.bold("ERROR DETAILS"));
  console.error(chalk.red.bold(separator) + "\n");

  // Use Effect's Cause.pretty for structured error information
  console.error(chalk.yellow.bold("Effect Cause:"));
  console.error(Cause.pretty(exit.cause));

  console.error("\n" + chalk.gray(divider) + "\n");

  // Extract defects and format them with pretty-error
  const defects = Cause.defects(exit.cause);
  if (defects.length > 0) {
    console.error(chalk.cyan.bold("Defects (formatted):"));

    for (const defect of defects) {
      if (defect instanceof Error) {
        console.error(pe.render(defect));
      } else {
        console.error(chalk.red(String(defect)));
      }
    }
  }

  console.error(chalk.red.bold(separator) + "\n");
};
