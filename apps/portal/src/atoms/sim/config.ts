import { atom } from "jotai";

export type TargetType = "patchwerk" | "movement" | "aoe";

export const fightDurationAtom = atom<number>(300);
export const iterationsAtom = atom<number>(1000);
export const targetTypeAtom = atom<TargetType>("patchwerk");
