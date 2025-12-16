import { createPersistedOrderAtom } from "../utils";

export type EditorCardId =
  | "rotation-script"
  | "templates"
  | "syntax-reference"
  | "validation";

export const editorCardOrderAtom = createPersistedOrderAtom<EditorCardId>(
  "editor-card-order-v2",
  ["rotation-script", "templates", "syntax-reference", "validation"],
);
