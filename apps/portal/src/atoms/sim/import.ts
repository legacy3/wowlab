import { atom } from "jotai";

export const simcStringAtom = atom<string>("");

export const importStatusAtom = atom<
  "idle" | "importing" | "success" | "error"
>("idle");

export const importErrorAtom = atom<string | null>(null);
