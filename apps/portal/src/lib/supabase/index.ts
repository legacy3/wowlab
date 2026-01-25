/* eslint-disable */

// Client

export { createClient } from "./client";

// Middleware

export { updateSession } from "./middleware";

// Types

export type { Database } from "./database.types";
export type {
  Aura,
  Class,
  GameRow,
  GlobalColor,
  GlobalString,
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

// Note: Server client must be imported directly from "./server" in server components to avoid bundling next/headers in client code
