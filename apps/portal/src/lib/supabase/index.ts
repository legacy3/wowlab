export { createClient } from "./client";
export type { Database } from "./database.types";
export { updateSession } from "./middleware";
// Note: Server client must be imported directly from "./server" in server components
// to avoid bundling next/headers in client code
export type {
  Aura,
  GameRow,
  Insert,
  Item,
  ItemSummary,
  Row,
  Spec,
  SpecSummary,
  SpecTraits,
  Spell,
  SpellSummary,
  Update,
  UserIdentity,
  View,
} from "./types";
