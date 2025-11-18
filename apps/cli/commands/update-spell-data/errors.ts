import * as Data from "effect/Data";

export class FileReadError extends Data.TaggedError("FileReadError")<{
  readonly filePath: string;
  readonly cause: unknown;
}> {
  get message() {
    return `Failed to read file ${this.filePath}: ${String(this.cause)}`;
  }
}

export class JsonParseError extends Data.TaggedError("JsonParseError")<{
  readonly filePath: string;
  readonly cause: unknown;
}> {
  get message() {
    return `Failed to parse JSON from ${this.filePath}: ${String(this.cause)}`;
  }
}

export class MissingEnvironmentError extends Data.TaggedError(
  "MissingEnvironmentError",
)<{
  readonly variables: readonly string[];
}> {
  get message() {
    return `Missing required environment variables: ${this.variables.join(", ")}`;
  }
}

export class SupabaseError extends Data.TaggedError("SupabaseError")<{
  readonly operation: string;
  readonly message: string;
}> {}
