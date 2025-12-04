export interface CombatSegment {
  readonly id: string;
  readonly spellId: number;
  readonly spellName: string;
  readonly start: number;
  readonly end: number;
  readonly duration: number;
  readonly color: string;
  readonly track: "Abilities" | "Buffs" | "Defensives";
}

const spellMeta: Record<
  number,
  { duration: number; track: CombatSegment["track"] }
> = {
  34026: { duration: 0.8, track: "Abilities" },
  193455: { duration: 1.4, track: "Abilities" },
  217200: { duration: 0.5, track: "Abilities" },
  19574: { duration: 15, track: "Buffs" },
  359844: { duration: 20, track: "Buffs" },
  186265: { duration: 8, track: "Defensives" },
  321530: { duration: 12, track: "Buffs" },
};

const colorBySpellId: Record<number, string> = {
  34026: "#7C3AED",
  193455: "#0EA5E9",
  217200: "#F97316",
  19574: "#16A34A",
  359844: "#EAB308",
  186265: "#06B6D4",
  321530: "#EF4444",
};

const spellNames: Record<number, string> = {
  34026: "Kill Command",
  193455: "Cobra Shot",
  217200: "Barbed Shot",
  19574: "Bestial Wrath",
  359844: "Call of the Wild",
  186265: "Aspect of the Turtle",
  321530: "Bloodshed",
};

function generateSegments(): CombatSegment[] {
  const segments: CombatSegment[] = [];
  let idx = 0;

  const add = (spellId: number, time: number) => {
    const meta = spellMeta[spellId];
    segments.push({
      id: `${spellId}-${idx++}`,
      spellId,
      spellName: spellNames[spellId],
      start: time,
      end: time + meta.duration,
      duration: meta.duration,
      color: colorBySpellId[spellId],
      track: meta.track,
    });
  };

  add(19574, 0);
  add(359844, 0.1);

  let t = 0.5;
  while (t < 60) {
    if (Math.floor(t) % 6 === 0) {
      add(34026, t);
      t += 1;
    }
    if (Math.floor(t) % 8 === 0 && t > 2) {
      add(217200, t);
      t += 0.6;
    }
    add(193455, t);
    t += 1.8;
    if (Math.abs(t - 20) < 1) add(321530, 20);
    if (Math.abs(t - 45) < 1) add(321530, 45);
    if (Math.abs(t - 30) < 1) add(19574, 30);
    if (Math.abs(t - 35) < 1) add(186265, 35);
  }

  return segments.sort((a, b) => a.start - b.start);
}

export const combatSegments = generateSegments();
export const trackGroups: CombatSegment["track"][] = [
  "Abilities",
  "Buffs",
  "Defensives",
];
export const timelineBounds = { min: 0, max: 60 };

const epoch = new Date("2024-01-01T00:00:00Z").getTime();
export const toDate = (sec: number) => new Date(epoch + sec * 1000);
export const fromDate = (d: Date) => (d.getTime() - epoch) / 1000;
