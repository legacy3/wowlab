import { atom } from "jotai";

export type SimClass = "priest" | "mage" | "warlock" | "paladin";
export type SimSpec = "shadow" | "disc" | "holy" | "fire" | "frost" | "arcane";
export type GearPreset = "bis" | "budget" | "fresh";
export type TargetType = "patchwerk" | "movement" | "aoe";

export const selectedClassAtom = atom<SimClass | null>(null);
export const selectedSpecAtom = atom<SimSpec | null>(null);
export const itemLevelAtom = atom<number>(70);
export const gearPresetAtom = atom<GearPreset | null>(null);
export const fightDurationAtom = atom<number>(300);
export const iterationsAtom = atom<number>(1000);
export const targetTypeAtom = atom<TargetType>("patchwerk");
