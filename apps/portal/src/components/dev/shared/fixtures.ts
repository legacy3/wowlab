import type { Character, Item, Profession, Slot } from "@/lib/sim";
import type { NodeWithMeta } from "@/lib/state";

export const fixtures = {
  character: {
    class: "shaman",
    level: 80,
    name: "Wellenwilli",
    professions: [],
    race: "Tauren",
    region: "eu",
    server: "Blackmoore",
    spec: "Restoration",
  } satisfies Character,

  charts: {
    bar: [
      { label: "Jan", value: 45 },
      { label: "Feb", value: 62 },
      { label: "Mar", value: 38 },
      { label: "Apr", value: 71 },
      { label: "May", value: 55 },
      { label: "Jun", value: 83 },
    ],
    line: [
      { x: 0, y: 20 },
      { x: 1, y: 35 },
      { x: 2, y: 28 },
      { x: 3, y: 55 },
      { x: 4, y: 43 },
      { x: 5, y: 67 },
      { x: 6, y: 58 },
      { x: 7, y: 72 },
    ],
    multiLine: [
      [
        { x: 0, y: 45 },
        { x: 1, y: 52 },
        { x: 2, y: 48 },
        { x: 3, y: 61 },
        { x: 4, y: 55 },
        { x: 5, y: 72 },
        { x: 6, y: 68 },
        { x: 7, y: 75 },
      ],
      [
        { x: 0, y: 32 },
        { x: 1, y: 38 },
        { x: 2, y: 35 },
        { x: 3, y: 42 },
        { x: 4, y: 39 },
        { x: 5, y: 48 },
        { x: 6, y: 45 },
        { x: 7, y: 51 },
      ],
    ],
    pie: [
      { label: "Fire", value: 35 },
      { label: "Frost", value: 25 },
      { label: "Arcane", value: 20 },
      { label: "Nature", value: 20 },
    ],
    // Simulated DPS timeline data (30 seconds of combat)
    dpsTimeline: Array.from({ length: 30 }, (_, i) => ({
      x: i,
      y:
        45000 +
        Math.sin(i * 0.5) * 8000 +
        (Math.random() - 0.5) * 12000 +
        i * 500,
    })),
    // DPS distribution across multiple pulls
    dpsDistribution: [
      52000, 54500, 48000, 56000, 51000, 49500, 55000, 53000, 50000, 57000,
      52500, 54000, 49000, 55500, 51500, 53500, 50500, 56500, 52000, 48500,
      54500, 51000, 55000, 49500, 53000, 50000, 56000, 52500, 54000, 51500,
    ],
  },

  code: {
    reactHook: `import { useSpell } from "@/lib/state";

export function SpellInfo({ id }: { id: number }) {
  const { data: spell } = useSpell(id);

  if (!spell) {
    return null;
  }

  return <div>{spell.name}</div>;
}`,
  },

  equipment: [
    { id: 212009, slot: "head" as Slot },
    { id: 215134, slot: "neck" as Slot },
    { id: 212003, slot: "shoulder" as Slot },
    { id: 222817, slot: "back" as Slot },
    { id: 212011, slot: "chest" as Slot },
    { id: 212007, slot: "wrist" as Slot },
    { id: 212006, slot: "hands" as Slot },
    { id: 212002, slot: "waist" as Slot },
    { id: 212004, slot: "legs" as Slot },
    { id: 212000, slot: "feet" as Slot },
    { id: 215135, slot: "finger1" as Slot },
    { id: 215136, slot: "finger2" as Slot },
    { id: 219314, slot: "trinket1" as Slot },
    { id: 219315, slot: "trinket2" as Slot },
    { id: 222446, slot: "main_hand" as Slot },
  ] satisfies Item[],

  error: {
    simple: "Error: Failed to connect to simulation server",
    stackTrace: `TypeError: Cannot read property 'dps' of undefined
at calculateDamage (engine.ts:142)
at runSimulation (simulation.ts:89)
at async main (index.ts:12)`,
  },

  nodes: {
    list: [
      {
        accessType: "private",
        claim_code: null,
        created_at: "2026-01-01T00:00:00Z",
        id: "node-1",
        last_seen_at: "2026-01-16T10:00:00Z",
        max_parallel: 8,
        name: "Gaming PC",
        owner: "me",
        platform: "windows",
        status: "online",
        total_cores: 12,
        user_id: "user-1",
        version: "1.2.0",
      },
      {
        accessType: "private",
        claim_code: null,
        created_at: "2026-01-01T00:00:00Z",
        id: "node-2",
        last_seen_at: "2026-01-16T10:01:30Z",
        max_parallel: 16,
        name: "Home Server",
        owner: "me",
        platform: "linux",
        status: "online",
        total_cores: 16,
        user_id: "user-1",
        version: "1.2.0",
      },
      {
        accessType: "public",
        claim_code: null,
        created_at: "2026-01-01T00:00:00Z",
        id: "node-3",
        last_seen_at: "2026-01-15T10:00:00Z",
        max_parallel: 4,
        name: "MacBook Pro",
        owner: "me",
        platform: "macos",
        status: "offline",
        total_cores: 10,
        user_id: "user-1",
        version: "1.1.8",
      },
      {
        accessType: "guild",
        claim_code: null,
        created_at: "2026-01-01T00:00:00Z",
        id: "node-4",
        last_seen_at: "2026-01-16T10:01:50Z",
        max_parallel: 32,
        name: "Guild Server",
        owner: "shared",
        platform: "linux",
        status: "online",
        total_cores: 64,
        user_id: "user-2",
        version: "1.2.0",
      },
      {
        accessType: "private",
        claim_code: null,
        created_at: "2026-01-01T00:00:00Z",
        id: "node-5",
        last_seen_at: "2026-01-16T09:57:00Z",
        max_parallel: 0,
        name: "Cloud Instance",
        owner: "me",
        platform: "linux",
        status: "pending",
        total_cores: 8,
        user_id: "user-1",
        version: "1.2.0",
      },
    ] as NodeWithMeta[],
  },

  professions: [
    { name: "Alchemy", rank: 525 },
    { name: "Herbalism", rank: 525 },
  ] satisfies Profession[],

  specs: [
    { label: "Restoration", value: "restoration" },
    { label: "Enhancement", value: "enhancement" },
    { label: "Elemental", value: "elemental" },
    { label: "Holy", value: "holy" },
    { label: "Protection", value: "protection" },
  ],

  table: {
    leaderboard: [
      { id: 1, name: "Alice", role: "Tank", score: "125,432" },
      { id: 2, name: "Bob", role: "Healer", score: "118,291" },
      { id: 3, name: "Carol", role: "DPS", score: "112,847" },
      { id: 4, name: "Dave", role: "DPS", score: "109,523" },
    ],
  },
};
