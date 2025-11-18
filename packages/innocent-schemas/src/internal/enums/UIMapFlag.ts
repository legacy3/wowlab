import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum UIMapFlag {
  NoHighlight = 1,
  ShowOverlays = 2,
  ShowTaxiNodes = 4,
  GarrisonMap = 8,
  FallbackToParentMap = 16,
  NoHighlightTexture = 32,
  ShowTaskObjectives = 64,
  NoWorldPositions = 128,
  HideArchaeologyDigs = 256,
  DoNotTranslateBranches = 512,
  HideIcons = 1024,
  HideVignettes = 2048,
  ForceAllOverlayExplored = 4096,
  FlightMapShowZoomOut = 8192,
  FlightMapAutoZoom = 16384,
  ForceOnNavbar = 32768,
  AlwaysAllowUserWaypoints = 65536,
  AlwaysAllowTaxiPathing = 131072,
  ForceAllowMapLinks = 262144,
  DoNotShowOnNavbar = 524288,
  IsCityMap = 1048576,
  IgnoreInTranslationsToParent = 2097152,
}

export const UIMapFlagSchema = Schema.Enums(UIMapFlag);
