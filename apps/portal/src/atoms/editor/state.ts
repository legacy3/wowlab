import { atomWithStorage } from "jotai/utils";

export type EditorCardId =
  | "rotation-script"
  | "templates"
  | "syntax-reference"
  | "validation";

export const editorCardOrderAtom = atomWithStorage<readonly EditorCardId[]>(
  "editor-card-order",
  ["rotation-script", "templates", "syntax-reference", "validation"],
);
