import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum UIWidgetVisualizationType {
  IconAndText = 0,
  CaptureBar = 1,
  StatusBar = 2,
  DoubleStatusBar = 3,
  IconTextAndBackground = 4,
  DoubleIconAndText = 5,
  StackedResourceTracker = 6,
  IconTextAndCurrencies = 7,
  TextWithState = 8,
  HorizontalCurrencies = 9,
  BulletTextList = 10,
  ScenarioHeaderCurrenciesAndBackground = 11,
  TextureAndText = 12,
  SpellDisplay = 13,
  DoubleStateIconRow = 14,
  TextureAndTextRow = 15,
  ZoneControl = 16,
  CaptureZone = 17,
  TextureWithAnimation = 18,
  DiscreteProgressSteps = 19,
  ScenarioHeaderTimer = 20,
  TextColumnRow = 21,
  Spacer = 22,
  UnitPowerBar = 23,
  FillUpFrames = 24,
  TextWithSubtext = 25,
  MapPinAnimation = 26,
  ItemDisplay = 27,
  TugOfWar = 28,
  ScenarioHeaderDelves = 29,
  ButtonHeader = 30,
}

export const UIWidgetVisualizationTypeSchema = Schema.Enums(
  UIWidgetVisualizationType,
);
