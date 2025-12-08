import { createPersistedOrderAtom } from "../utils";

export type EditorCardId =
  | "rotation-script"
  | "templates"
  | "syntax-reference"
  | "validation";

export const editorCardOrderAtom = createPersistedOrderAtom<EditorCardId>(
  "editor-card-order",
  ["rotation-script", "templates", "syntax-reference", "validation"],
);
