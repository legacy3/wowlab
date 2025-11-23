import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import PrettyError from "pretty-error";

// Initialize pretty-error for formatting JavaScript stack traces
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage("effect");

export const printFormattedError = (exit: Exit.Exit<unknown, unknown>): void => {
  if (!Exit.isFailure(exit)) {
    return;
  }

  console.error("\n" + "=".repeat(80));
  console.error("ERROR DETAILS");
  console.error("=".repeat(80) + "\n");

  // Use Effect's Cause.pretty for structured error information
  console.error("Effect Cause:");
  console.error(Cause.pretty(exit.cause));

  console.error("\n" + "-".repeat(80) + "\n");

  // Extract defects and format them with pretty-error
  const defects = Cause.defects(exit.cause);
  if (defects.length > 0) {
    console.error("Defects (formatted):");
    
    for (const defect of defects) {
      if (defect instanceof Error) {
        console.error(pe.render(defect));
      } else {
        console.error(defect);
      }
    }
  }

  console.error("=".repeat(80) + "\n");
};
