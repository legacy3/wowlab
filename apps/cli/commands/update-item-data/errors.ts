import * as Data from "effect/Data";

export class FileReadError extends Data.TaggedError("FileReadError")<{
  readonly cause: unknown;
  readonly filePath: string;
}> {
  get message() {
    return `Failed to read file ${this.filePath}: ${String(this.cause)}`;
  }
}

export class JsonParseError extends Data.TaggedError("JsonParseError")<{
  readonly cause: unknown;
  readonly filePath: string;
}> {
  get message() {
    return `Failed to parse JSON from ${this.filePath}: ${String(this.cause)}`;
  }
}

export class MissingEnvironmentError extends Data.TaggedError(
  "MissingEnvironmentError",
)<{
  readonly variables: string[];
}> {
  get message() {
    return `Missing environment variables: ${this.variables.join(", ")}`;
  }
}

export class SupabaseError extends Data.TaggedError("SupabaseError")<{
  readonly errorMessage: string;
  readonly operation: string;
}> {
  get message() {
    return `Supabase error during ${this.operation}: ${this.errorMessage}`;
  }
}
