/* eslint-disable no-redeclare */

import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

export const SpellIDSchema = Schema.NumberFromString.pipe(
  Schema.int(),
  Schema.filter((n) => n === -1 || n >= 0, {
    message: () => "Expected -1 or a non-negative integer",
  }),
  Schema.brand("SpellID"),
);

export type SpellID = Schema.Schema.Type<typeof SpellIDSchema>;

export const SpellID = Brand.refined<SpellID>(
  (n) => Number.isInteger(n) && (n === -1 || n >= 0),
  (n) => Brand.error(`Expected ${n} to be -1 or a non-negative integer`),
);

export const UnitIDSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("UnitID"),
);

export type UnitID = Schema.Schema.Type<typeof UnitIDSchema>;

export const UnitID = Brand.refined<UnitID>(
  (s) => s.length > 0,
  (s) => Brand.error(`Expected non-empty string, got "${s}"`),
);

export const ProjectileIDSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("ProjectileID"),
);

export type ProjectileID = Schema.Schema.Type<typeof ProjectileIDSchema>;

export const ProjectileID = Brand.refined<ProjectileID>(
  (s) => s.length > 0,
  (s) => Brand.error(`Expected non-empty string, got "${s}"`),
);

export const EventIDSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("EventID"),
);

export type EventID = Schema.Schema.Type<typeof EventIDSchema>;

export const EventID = Brand.refined<EventID>(
  (s) => s.length > 0,
  (s) => Brand.error(`Expected non-empty string, got "${s}"`),
);

// Combat log branded types
export const UnitFlagsSchema = Schema.Number.pipe(Schema.brand("UnitFlags"));
export type UnitFlags = Schema.Schema.Type<typeof UnitFlagsSchema>;
export const UnitFlags = Brand.nominal<UnitFlags>();

export const RaidFlagsSchema = Schema.Number.pipe(Schema.brand("RaidFlags"));
export type RaidFlags = Schema.Schema.Type<typeof RaidFlagsSchema>;
export const RaidFlags = Brand.nominal<RaidFlags>();

export const SpellSchoolFlagsSchema = Schema.Number.pipe(
  Schema.brand("SpellSchoolFlags"),
);
export type SpellSchoolFlags = Schema.Schema.Type<
  typeof SpellSchoolFlagsSchema
>;
export const SpellSchoolFlags = Brand.nominal<SpellSchoolFlags>();
