import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GraphicsValidationResult {
  Supported = 0,
  Illegal = 1,
  Unsupported = 2,
  Graphics = 3,
  DualCore = 4,
  QuadCore = 5,
  CpuMem_2 = 6,
  CpuMem_4 = 7,
  CpuMem_8 = 8,
  Needs_5_0 = 9,
  Needs_6_0 = 10,
  NeedsRt = 11,
  NeedsDx12 = 12,
  NeedsDx12Vrs2 = 13,
  NeedsAppleGpu = 14,
  NeedsAmdGpu = 15,
  NeedsIntelGpu = 16,
  NeedsNvidiaGpu = 17,
  NeedsQualcommGpu = 18,
  NeedsMacOs_10_13 = 19,
  NeedsMacOs_10_14 = 20,
  NeedsMacOs_10_15 = 21,
  NeedsMacOs_11_0 = 22,
  NeedsMacOs_12_0 = 23,
  NeedsMacOs_13_0 = 24,
  NeedsWindows_10 = 25,
  NeedsWindows_11 = 26,
  MacOsUnsupported = 27,
  WindowsUnsupported = 28,
  LegacyUnsupported = 29,
  Dx11Unsupported = 30,
  Dx12Win7Unsupported = 31,
  RemoteDesktopUnsupported = 32,
  WineUnsupported = 33,
  NvapiWineUnsupported = 34,
  AppleGpuUnsupported = 35,
  AmdGpuUnsupported = 36,
  IntelGpuUnsupported = 37,
  NvidiaGpuUnsupported = 38,
  QualcommGpuUnsupported = 39,
  GpuDriver = 40,
  CompatMode = 41,
  Unknown = 42,
}

export const GraphicsValidationResultSchema = Schema.Enums(
  GraphicsValidationResult,
);
