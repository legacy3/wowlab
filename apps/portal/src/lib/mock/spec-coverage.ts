export type SupportStatus = "supported" | "unknown";

export type SpellEntry = {
  id: number;
  name: string;
  supported: boolean;
};

export type SpecCoverage = {
  className: WowClassName;
  specName: string;
  spells: SpellEntry[];
};

export type WowClassName =
  | "Death Knight"
  | "Demon Hunter"
  | "Druid"
  | "Evoker"
  | "Hunter"
  | "Mage"
  | "Monk"
  | "Paladin"
  | "Priest"
  | "Rogue"
  | "Shaman"
  | "Warlock"
  | "Warrior";

export const CLASS_COLORS: Record<WowClassName, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7D0A",
  Evoker: "#33937F",
  Hunter: "#ABD473",
  Mage: "#69CCF0",
  Monk: "#00FF96",
  Paladin: "#F58CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF569",
  Shaman: "#0070DE",
  Warlock: "#9482C9",
  Warrior: "#C79C6E",
};

export const CLASS_ORDER: WowClassName[] = [
  "Death Knight",
  "Demon Hunter",
  "Druid",
  "Evoker",
  "Hunter",
  "Mage",
  "Monk",
  "Paladin",
  "Priest",
  "Rogue",
  "Shaman",
  "Warlock",
  "Warrior",
];

export function calculateCoverage(spells: SpellEntry[]): number {
  if (spells.length === 0) {
    return 0;
  }

  const supported = spells.filter((s) => s.supported).length;

  return Math.round((supported / spells.length) * 100);
}

export function getCounts(spells: SpellEntry[]) {
  return {
    supported: spells.filter((s) => s.supported).length,
    total: spells.length,
  };
}

// TODO Get this from the dbc tables
export const SPEC_COVERAGE_DATA: SpecCoverage[] = [
  // Death Knight
  {
    className: "Death Knight",
    specName: "Blood",
    spells: [
      { id: 49998, name: "Death Strike", supported: true },
      { id: 195182, name: "Marrowrend", supported: true },
      { id: 206930, name: "Heart Strike", supported: true },
      { id: 50842, name: "Blood Boil", supported: true },
      { id: 47541, name: "Death Coil", supported: true },
      { id: 48707, name: "Anti-Magic Shell", supported: true },
      { id: 55233, name: "Vampiric Blood", supported: true },
      { id: 49028, name: "Dancing Rune Weapon", supported: false },
      { id: 221562, name: "Asphyxiate", supported: false },
      { id: 108199, name: "Gorefiend's Grasp", supported: false },
    ],
  },
  {
    className: "Death Knight",
    specName: "Frost",
    spells: [
      { id: 49143, name: "Frost Strike", supported: true },
      { id: 49184, name: "Howling Blast", supported: true },
      { id: 49020, name: "Obliterate", supported: true },
      { id: 196770, name: "Remorseless Winter", supported: true },
      { id: 51271, name: "Pillar of Frost", supported: true },
      { id: 279302, name: "Frostwyrm's Fury", supported: true },
      { id: 57330, name: "Horn of Winter", supported: true },
      { id: 47568, name: "Empower Rune Weapon", supported: true },
      { id: 152279, name: "Breath of Sindragosa", supported: false },
      { id: 207230, name: "Frostscythe", supported: true },
    ],
  },
  {
    className: "Death Knight",
    specName: "Unholy",
    spells: [
      { id: 47541, name: "Death Coil", supported: true },
      { id: 85948, name: "Festering Strike", supported: true },
      { id: 55090, name: "Scourge Strike", supported: true },
      { id: 63560, name: "Dark Transformation", supported: true },
      { id: 275699, name: "Apocalypse", supported: false },
      { id: 42650, name: "Army of the Dead", supported: false },
      { id: 207317, name: "Epidemic", supported: true },
      { id: 115989, name: "Unholy Blight", supported: true },
      { id: 46584, name: "Raise Dead", supported: true },
      { id: 49206, name: "Summon Gargoyle", supported: false },
    ],
  },
  // Demon Hunter
  {
    className: "Demon Hunter",
    specName: "Havoc",
    spells: [
      { id: 162243, name: "Demon's Bite", supported: true },
      { id: 185123, name: "Throw Glaive", supported: true },
      { id: 198013, name: "Eye Beam", supported: true },
      { id: 191427, name: "Metamorphosis", supported: true },
      { id: 188499, name: "Blade Dance", supported: true },
      { id: 162794, name: "Chaos Strike", supported: true },
      { id: 195072, name: "Fel Rush", supported: true },
      { id: 258920, name: "Immolation Aura", supported: true },
      { id: 258860, name: "Essence Break", supported: true },
      { id: 211881, name: "Fel Eruption", supported: false },
    ],
  },
  {
    className: "Demon Hunter",
    specName: "Vengeance",
    spells: [
      { id: 228477, name: "Soul Cleave", supported: true },
      { id: 204596, name: "Sigil of Flame", supported: true },
      { id: 204021, name: "Fiery Brand", supported: true },
      { id: 212084, name: "Fel Devastation", supported: false },
      { id: 203720, name: "Demon Spikes", supported: true },
      { id: 178740, name: "Immolation Aura", supported: true },
      { id: 189110, name: "Infernal Strike", supported: true },
      { id: 263648, name: "Soul Barrier", supported: false },
      { id: 207407, name: "Soul Carver", supported: true },
      { id: 202140, name: "Fracture", supported: true },
    ],
  },
  // Druid
  {
    className: "Druid",
    specName: "Balance",
    spells: [
      { id: 190984, name: "Wrath", supported: true },
      { id: 194153, name: "Starfire", supported: true },
      { id: 78674, name: "Starsurge", supported: true },
      { id: 191034, name: "Starfall", supported: true },
      { id: 93402, name: "Sunfire", supported: true },
      { id: 8921, name: "Moonfire", supported: true },
      { id: 194223, name: "Celestial Alignment", supported: true },
      { id: 102560, name: "Incarnation: Chosen of Elune", supported: true },
      { id: 202347, name: "Stellar Flare", supported: false },
      { id: 274281, name: "New Moon", supported: false },
    ],
  },
  {
    className: "Druid",
    specName: "Feral",
    spells: [
      { id: 5221, name: "Shred", supported: true },
      { id: 1079, name: "Rip", supported: true },
      { id: 22568, name: "Ferocious Bite", supported: true },
      { id: 155722, name: "Rake", supported: true },
      { id: 106830, name: "Thrash", supported: true },
      { id: 274837, name: "Feral Frenzy", supported: true },
      { id: 106951, name: "Berserk", supported: true },
      { id: 102543, name: "Incarnation: Avatar of Ashamane", supported: true },
      { id: 5217, name: "Tiger's Fury", supported: true },
      { id: 391528, name: "Convoke the Spirits", supported: false },
    ],
  },
  {
    className: "Druid",
    specName: "Guardian",
    spells: [
      { id: 33917, name: "Mangle", supported: true },
      { id: 77758, name: "Thrash", supported: true },
      { id: 213764, name: "Swipe", supported: true },
      { id: 192081, name: "Ironfur", supported: true },
      { id: 22842, name: "Frenzied Regeneration", supported: true },
      { id: 22812, name: "Barkskin", supported: true },
      { id: 61336, name: "Survival Instincts", supported: true },
      { id: 50334, name: "Berserk", supported: false },
      { id: 80313, name: "Pulverize", supported: false },
      { id: 204066, name: "Lunar Beam", supported: false },
    ],
  },
  {
    className: "Druid",
    specName: "Restoration",
    spells: [
      { id: 774, name: "Rejuvenation", supported: false },
      { id: 8936, name: "Regrowth", supported: false },
      { id: 48438, name: "Wild Growth", supported: false },
      { id: 33763, name: "Lifebloom", supported: false },
      { id: 18562, name: "Swiftmend", supported: false },
      { id: 102342, name: "Ironbark", supported: false },
      { id: 740, name: "Tranquility", supported: false },
      { id: 33891, name: "Incarnation: Tree of Life", supported: false },
      { id: 102351, name: "Cenarion Ward", supported: false },
      { id: 197721, name: "Flourish", supported: false },
    ],
  },
  // Evoker
  {
    className: "Evoker",
    specName: "Devastation",
    spells: [
      { id: 362969, name: "Azure Strike", supported: true },
      { id: 361469, name: "Living Flame", supported: true },
      { id: 357208, name: "Fire Breath", supported: true },
      { id: 396286, name: "Eternity Surge", supported: true },
      { id: 359073, name: "Disintegrate", supported: true },
      { id: 370452, name: "Shattering Star", supported: true },
      { id: 359618, name: "Essence Burst", supported: true },
      { id: 375087, name: "Dragonrage", supported: false },
      { id: 382266, name: "Fire Breath (Empowered)", supported: true },
      { id: 382411, name: "Eternity Surge (Empowered)", supported: true },
    ],
  },
  {
    className: "Evoker",
    specName: "Preservation",
    spells: [
      { id: 361469, name: "Living Flame", supported: false },
      { id: 366155, name: "Reversion", supported: false },
      { id: 355936, name: "Dream Breath", supported: false },
      { id: 382614, name: "Dream Flight", supported: false },
      { id: 363534, name: "Rewind", supported: false },
      { id: 357170, name: "Time Dilation", supported: false },
      { id: 364343, name: "Echo", supported: false },
      { id: 370960, name: "Emerald Communion", supported: false },
      { id: 359816, name: "Dream Projection", supported: false },
      { id: 370665, name: "Rescue", supported: false },
    ],
  },
  {
    className: "Evoker",
    specName: "Augmentation",
    spells: [
      { id: 362969, name: "Azure Strike", supported: true },
      { id: 361469, name: "Living Flame", supported: true },
      { id: 395152, name: "Ebon Might", supported: false },
      { id: 409311, name: "Prescience", supported: false },
      { id: 395160, name: "Eruption", supported: true },
      { id: 396286, name: "Upheaval", supported: true },
      { id: 360995, name: "Verdant Embrace", supported: false },
      { id: 370553, name: "Tip the Scales", supported: true },
      { id: 404977, name: "Time Skip", supported: false },
      { id: 403631, name: "Breath of Eons", supported: false },
    ],
  },
  // Hunter
  {
    className: "Hunter",
    specName: "Beast Mastery",
    spells: [
      { id: 193455, name: "Cobra Shot", supported: true },
      { id: 34026, name: "Kill Command", supported: true },
      { id: 217200, name: "Barbed Shot", supported: true },
      { id: 19574, name: "Bestial Wrath", supported: true },
      { id: 53209, name: "Chimaera Shot", supported: true },
      { id: 120679, name: "Dire Beast", supported: false },
      { id: 193530, name: "Aspect of the Wild", supported: true },
      { id: 201430, name: "Stampede", supported: false },
      { id: 321530, name: "Bloodshed", supported: true },
      { id: 360952, name: "Call of the Wild", supported: false },
    ],
  },
  {
    className: "Hunter",
    specName: "Marksmanship",
    spells: [
      { id: 185358, name: "Arcane Shot", supported: true },
      { id: 19434, name: "Aimed Shot", supported: true },
      { id: 257620, name: "Multi-Shot", supported: true },
      { id: 53351, name: "Kill Shot", supported: true },
      { id: 260402, name: "Double Tap", supported: true },
      { id: 288613, name: "Trueshot", supported: true },
      { id: 342049, name: "Chimaera Shot", supported: true },
      { id: 269751, name: "Precise Shots", supported: true },
      { id: 194595, name: "Lock and Load", supported: true },
      { id: 257044, name: "Rapid Fire", supported: true },
    ],
  },
  {
    className: "Hunter",
    specName: "Survival",
    spells: [
      { id: 186270, name: "Raptor Strike", supported: true },
      { id: 259387, name: "Mongoose Bite", supported: true },
      { id: 259495, name: "Wildfire Bomb", supported: true },
      { id: 269751, name: "Flanking Strike", supported: true },
      { id: 187708, name: "Carve", supported: true },
      { id: 259391, name: "Kill Command", supported: true },
      { id: 266779, name: "Coordinated Assault", supported: false },
      { id: 360966, name: "Spearhead", supported: true },
      { id: 212436, name: "Butchery", supported: true },
      { id: 162488, name: "Steel Trap", supported: false },
    ],
  },
  // Mage
  {
    className: "Mage",
    specName: "Arcane",
    spells: [
      { id: 30451, name: "Arcane Blast", supported: true },
      { id: 5143, name: "Arcane Missiles", supported: true },
      { id: 44425, name: "Arcane Barrage", supported: true },
      { id: 153626, name: "Arcane Orb", supported: true },
      { id: 12042, name: "Arcane Power", supported: true },
      { id: 365350, name: "Arcane Surge", supported: true },
      { id: 110959, name: "Greater Invisibility", supported: false },
      { id: 205032, name: "Arcane Explosion", supported: true },
      { id: 376103, name: "Radiant Spark", supported: false },
      { id: 321507, name: "Touch of the Magi", supported: true },
    ],
  },
  {
    className: "Mage",
    specName: "Fire",
    spells: [
      { id: 133, name: "Fireball", supported: true },
      { id: 11366, name: "Pyroblast", supported: true },
      { id: 108853, name: "Fire Blast", supported: true },
      { id: 190319, name: "Combustion", supported: true },
      { id: 2948, name: "Scorch", supported: true },
      { id: 153561, name: "Meteor", supported: true },
      { id: 44457, name: "Living Bomb", supported: false },
      { id: 257541, name: "Phoenix Flames", supported: true },
      { id: 31661, name: "Dragon's Breath", supported: true },
      { id: 2120, name: "Flamestrike", supported: true },
    ],
  },
  {
    className: "Mage",
    specName: "Frost",
    spells: [
      { id: 116, name: "Frostbolt", supported: true },
      { id: 44614, name: "Flurry", supported: true },
      { id: 30455, name: "Ice Lance", supported: true },
      { id: 84714, name: "Frozen Orb", supported: true },
      { id: 12472, name: "Icy Veins", supported: true },
      { id: 153595, name: "Comet Storm", supported: true },
      { id: 190356, name: "Blizzard", supported: true },
      { id: 199786, name: "Glacial Spike", supported: true },
      { id: 120, name: "Cone of Cold", supported: true },
      { id: 157997, name: "Ice Nova", supported: false },
    ],
  },
  // Monk
  {
    className: "Monk",
    specName: "Brewmaster",
    spells: [
      { id: 100784, name: "Blackout Kick", supported: true },
      { id: 205523, name: "Blackout Combo", supported: false },
      { id: 121253, name: "Keg Smash", supported: true },
      { id: 115181, name: "Breath of Fire", supported: true },
      { id: 322101, name: "Expel Harm", supported: true },
      { id: 115203, name: "Fortifying Brew", supported: true },
      { id: 115176, name: "Zen Meditation", supported: false },
      { id: 115399, name: "Black Ox Brew", supported: true },
      { id: 387184, name: "Weapons of Order", supported: false },
      { id: 132578, name: "Invoke Niuzao", supported: false },
    ],
  },
  {
    className: "Monk",
    specName: "Mistweaver",
    spells: [
      { id: 100784, name: "Blackout Kick", supported: false },
      { id: 115151, name: "Renewing Mist", supported: false },
      { id: 116670, name: "Vivify", supported: false },
      { id: 191837, name: "Essence Font", supported: false },
      { id: 116849, name: "Life Cocoon", supported: false },
      { id: 115310, name: "Revival", supported: false },
      { id: 115450, name: "Detox", supported: false },
      { id: 124682, name: "Enveloping Mist", supported: false },
      { id: 198898, name: "Song of Chi-Ji", supported: false },
      { id: 325197, name: "Invoke Chi-Ji", supported: false },
    ],
  },
  {
    className: "Monk",
    specName: "Windwalker",
    spells: [
      { id: 100784, name: "Blackout Kick", supported: true },
      { id: 107428, name: "Rising Sun Kick", supported: true },
      { id: 113656, name: "Fists of Fury", supported: true },
      { id: 100780, name: "Tiger Palm", supported: true },
      { id: 101545, name: "Flying Serpent Kick", supported: true },
      { id: 137639, name: "Storm, Earth, and Fire", supported: false },
      { id: 152175, name: "Whirling Dragon Punch", supported: true },
      { id: 115098, name: "Chi Wave", supported: true },
      { id: 322109, name: "Touch of Death", supported: true },
      { id: 392983, name: "Strike of the Windlord", supported: true },
    ],
  },
  // Paladin
  {
    className: "Paladin",
    specName: "Holy",
    spells: [
      { id: 20473, name: "Holy Shock", supported: false },
      { id: 82326, name: "Holy Light", supported: false },
      { id: 19750, name: "Flash of Light", supported: false },
      { id: 85222, name: "Light of Dawn", supported: false },
      { id: 633, name: "Lay on Hands", supported: false },
      { id: 31842, name: "Avenging Wrath", supported: false },
      { id: 498, name: "Divine Protection", supported: false },
      { id: 1022, name: "Blessing of Protection", supported: false },
      { id: 216331, name: "Avenging Crusader", supported: false },
      { id: 200025, name: "Beacon of Virtue", supported: false },
    ],
  },
  {
    className: "Paladin",
    specName: "Protection",
    spells: [
      { id: 31935, name: "Avenger's Shield", supported: true },
      { id: 53600, name: "Shield of the Righteous", supported: true },
      { id: 26573, name: "Consecration", supported: true },
      { id: 20271, name: "Judgment", supported: true },
      { id: 275779, name: "Hammer of Wrath", supported: true },
      { id: 31850, name: "Ardent Defender", supported: true },
      { id: 86659, name: "Guardian of Ancient Kings", supported: true },
      { id: 31884, name: "Avenging Wrath", supported: true },
      { id: 387174, name: "Eye of Tyr", supported: false },
      { id: 389539, name: "Sentinel", supported: false },
    ],
  },
  {
    className: "Paladin",
    specName: "Retribution",
    spells: [
      { id: 35395, name: "Crusader Strike", supported: true },
      { id: 20271, name: "Judgment", supported: true },
      { id: 255937, name: "Wake of Ashes", supported: true },
      { id: 184575, name: "Blade of Justice", supported: true },
      { id: 85256, name: "Templar's Verdict", supported: true },
      { id: 53385, name: "Divine Storm", supported: true },
      { id: 31884, name: "Avenging Wrath", supported: true },
      { id: 231895, name: "Crusade", supported: true },
      { id: 343721, name: "Final Reckoning", supported: false },
      { id: 383328, name: "Final Verdict", supported: true },
    ],
  },
  // Priest
  {
    className: "Priest",
    specName: "Discipline",
    spells: [
      { id: 47540, name: "Penance", supported: false },
      { id: 585, name: "Smite", supported: true },
      { id: 17, name: "Power Word: Shield", supported: false },
      { id: 194509, name: "Power Word: Radiance", supported: false },
      { id: 47536, name: "Rapture", supported: false },
      { id: 33206, name: "Pain Suppression", supported: false },
      { id: 62618, name: "Power Word: Barrier", supported: false },
      { id: 110744, name: "Divine Star", supported: false },
      { id: 421453, name: "Ultimate Penitence", supported: false },
      { id: 314867, name: "Shadow Word: Death", supported: true },
    ],
  },
  {
    className: "Priest",
    specName: "Holy",
    spells: [
      { id: 2050, name: "Holy Word: Serenity", supported: false },
      { id: 34861, name: "Holy Word: Sanctify", supported: false },
      { id: 2061, name: "Flash Heal", supported: false },
      { id: 2060, name: "Heal", supported: false },
      { id: 596, name: "Prayer of Healing", supported: false },
      { id: 64843, name: "Divine Hymn", supported: false },
      { id: 47788, name: "Guardian Spirit", supported: false },
      { id: 200183, name: "Apotheosis", supported: false },
      { id: 372760, name: "Divine Word", supported: false },
      { id: 372835, name: "Lightwell", supported: false },
    ],
  },
  {
    className: "Priest",
    specName: "Shadow",
    spells: [
      { id: 8092, name: "Mind Blast", supported: true },
      { id: 15407, name: "Mind Flay", supported: true },
      { id: 34914, name: "Vampiric Touch", supported: true },
      { id: 589, name: "Shadow Word: Pain", supported: true },
      { id: 228260, name: "Void Eruption", supported: true },
      { id: 205448, name: "Void Bolt", supported: true },
      { id: 263165, name: "Void Torrent", supported: true },
      { id: 391109, name: "Dark Ascension", supported: true },
      { id: 64044, name: "Psychic Horror", supported: false },
      { id: 73510, name: "Mind Spike", supported: false },
    ],
  },
  // Rogue
  {
    className: "Rogue",
    specName: "Assassination",
    spells: [
      { id: 1329, name: "Mutilate", supported: true },
      { id: 703, name: "Garrote", supported: true },
      { id: 1943, name: "Rupture", supported: true },
      { id: 32645, name: "Envenom", supported: true },
      { id: 51723, name: "Fan of Knives", supported: true },
      { id: 79140, name: "Vendetta", supported: true },
      { id: 36554, name: "Shadowstep", supported: true },
      { id: 319175, name: "Deathmark", supported: true },
      { id: 381802, name: "Indiscriminate Carnage", supported: false },
      { id: 385627, name: "Kingsbane", supported: true },
    ],
  },
  {
    className: "Rogue",
    specName: "Outlaw",
    spells: [
      { id: 185763, name: "Pistol Shot", supported: true },
      { id: 193315, name: "Sinister Strike", supported: true },
      { id: 195457, name: "Grappling Hook", supported: true },
      { id: 315496, name: "Slice and Dice", supported: true },
      { id: 2098, name: "Dispatch", supported: true },
      { id: 13877, name: "Blade Flurry", supported: true },
      { id: 13750, name: "Adrenaline Rush", supported: true },
      { id: 271877, name: "Blade Rush", supported: true },
      { id: 51690, name: "Killing Spree", supported: false },
      { id: 381989, name: "Keep It Rolling", supported: false },
    ],
  },
  {
    className: "Rogue",
    specName: "Subtlety",
    spells: [
      { id: 185438, name: "Shadowstrike", supported: true },
      { id: 53, name: "Backstab", supported: true },
      { id: 196819, name: "Eviscerate", supported: true },
      { id: 212283, name: "Symbols of Death", supported: true },
      { id: 185313, name: "Shadow Dance", supported: true },
      { id: 121471, name: "Shadow Blades", supported: true },
      { id: 280719, name: "Secret Technique", supported: true },
      { id: 277925, name: "Shuriken Tornado", supported: true },
      { id: 1943, name: "Rupture", supported: true },
      { id: 319175, name: "Flagellation", supported: false },
    ],
  },
  // Shaman
  {
    className: "Shaman",
    specName: "Elemental",
    spells: [
      { id: 188196, name: "Lightning Bolt", supported: true },
      { id: 51505, name: "Lava Burst", supported: true },
      { id: 188389, name: "Flame Shock", supported: true },
      { id: 8042, name: "Earth Shock", supported: true },
      { id: 191634, name: "Stormkeeper", supported: true },
      { id: 114050, name: "Ascendance", supported: true },
      { id: 188443, name: "Chain Lightning", supported: true },
      { id: 192249, name: "Storm Elemental", supported: false },
      { id: 198067, name: "Fire Elemental", supported: false },
      { id: 210714, name: "Icefury", supported: true },
    ],
  },
  {
    className: "Shaman",
    specName: "Enhancement",
    spells: [
      { id: 17364, name: "Stormstrike", supported: true },
      { id: 60103, name: "Lava Lash", supported: true },
      { id: 188196, name: "Lightning Bolt", supported: true },
      { id: 51533, name: "Feral Spirit", supported: true },
      { id: 187874, name: "Crash Lightning", supported: true },
      { id: 384352, name: "Doom Winds", supported: true },
      { id: 115356, name: "Windstrike", supported: true },
      { id: 197214, name: "Sundering", supported: true },
      { id: 333957, name: "Primordial Wave", supported: false },
      { id: 342240, name: "Ice Strike", supported: true },
    ],
  },
  {
    className: "Shaman",
    specName: "Restoration",
    spells: [
      { id: 8004, name: "Healing Surge", supported: false },
      { id: 77472, name: "Healing Wave", supported: false },
      { id: 1064, name: "Chain Heal", supported: false },
      { id: 61295, name: "Riptide", supported: false },
      { id: 98008, name: "Spirit Link Totem", supported: false },
      { id: 108280, name: "Healing Tide Totem", supported: false },
      { id: 5394, name: "Healing Stream Totem", supported: false },
      { id: 114052, name: "Ascendance", supported: false },
      { id: 207399, name: "Ancestral Protection Totem", supported: false },
      { id: 157153, name: "Cloudburst Totem", supported: false },
    ],
  },
  // Warlock
  {
    className: "Warlock",
    specName: "Affliction",
    spells: [
      { id: 980, name: "Agony", supported: true },
      { id: 172, name: "Corruption", supported: true },
      { id: 30108, name: "Unstable Affliction", supported: true },
      { id: 48181, name: "Haunt", supported: true },
      { id: 198590, name: "Drain Soul", supported: true },
      { id: 27243, name: "Seed of Corruption", supported: true },
      { id: 205179, name: "Phantom Singularity", supported: true },
      { id: 386997, name: "Soul Rot", supported: true },
      { id: 316099, name: "Malefic Rapture", supported: true },
      { id: 324536, name: "Summon Darkglare", supported: false },
    ],
  },
  {
    className: "Warlock",
    specName: "Demonology",
    spells: [
      { id: 686, name: "Shadow Bolt", supported: true },
      { id: 104316, name: "Call Dreadstalkers", supported: true },
      { id: 105174, name: "Hand of Gul'dan", supported: true },
      { id: 265187, name: "Summon Demonic Tyrant", supported: false },
      { id: 267217, name: "Nether Portal", supported: false },
      { id: 264178, name: "Demonbolt", supported: true },
      { id: 267171, name: "Demonic Strength", supported: true },
      { id: 264130, name: "Power Siphon", supported: true },
      { id: 387398, name: "Doom", supported: true },
      { id: 386833, name: "Guillotine", supported: false },
    ],
  },
  {
    className: "Warlock",
    specName: "Destruction",
    spells: [
      { id: 348, name: "Immolate", supported: true },
      { id: 29722, name: "Incinerate", supported: true },
      { id: 116858, name: "Chaos Bolt", supported: true },
      { id: 17877, name: "Shadowburn", supported: true },
      { id: 80240, name: "Havoc", supported: true },
      { id: 1122, name: "Summon Infernal", supported: true },
      { id: 196447, name: "Channel Demonfire", supported: true },
      { id: 152108, name: "Cataclysm", supported: true },
      { id: 5740, name: "Rain of Fire", supported: true },
      { id: 387976, name: "Dimensional Rift", supported: false },
    ],
  },
  // Warrior
  {
    className: "Warrior",
    specName: "Arms",
    spells: [
      { id: 12294, name: "Mortal Strike", supported: true },
      { id: 1464, name: "Slam", supported: true },
      { id: 167105, name: "Colossus Smash", supported: true },
      { id: 772, name: "Rend", supported: true },
      { id: 227847, name: "Bladestorm", supported: true },
      { id: 262161, name: "Warbreaker", supported: true },
      { id: 107574, name: "Avatar", supported: true },
      { id: 1719, name: "Recklessness", supported: true },
      { id: 260643, name: "Skullsplitter", supported: true },
      { id: 384318, name: "Thunderous Roar", supported: false },
    ],
  },
  {
    className: "Warrior",
    specName: "Fury",
    spells: [
      { id: 184367, name: "Rampage", supported: true },
      { id: 23881, name: "Bloodthirst", supported: true },
      { id: 85288, name: "Raging Blow", supported: true },
      { id: 190411, name: "Whirlwind", supported: true },
      { id: 1719, name: "Recklessness", supported: true },
      { id: 228920, name: "Ravager", supported: true },
      { id: 315720, name: "Onslaught", supported: true },
      { id: 384318, name: "Thunderous Roar", supported: false },
      { id: 280772, name: "Siegebreaker", supported: true },
      { id: 5308, name: "Execute", supported: true },
    ],
  },
  {
    className: "Warrior",
    specName: "Protection",
    spells: [
      { id: 23922, name: "Shield Slam", supported: true },
      { id: 6572, name: "Revenge", supported: true },
      { id: 6343, name: "Thunder Clap", supported: true },
      { id: 2565, name: "Shield Block", supported: true },
      { id: 190456, name: "Ignore Pain", supported: true },
      { id: 12975, name: "Last Stand", supported: true },
      { id: 1160, name: "Demoralizing Shout", supported: true },
      { id: 107574, name: "Avatar", supported: true },
      { id: 228920, name: "Ravager", supported: true },
      { id: 384318, name: "Thunderous Roar", supported: false },
    ],
  },
];

export function getSpecsForClass(className: WowClassName): SpecCoverage[] {
  return SPEC_COVERAGE_DATA.filter((s) => s.className === className);
}

export function getOverallStats() {
  const allSpells = SPEC_COVERAGE_DATA.flatMap((s) => s.spells);
  const supported = allSpells.filter((s) => s.supported).length;

  return {
    totalSpecs: SPEC_COVERAGE_DATA.length,
    totalSpells: allSpells.length,
    supportedSpells: supported,
    coverage: Math.round((supported / allSpells.length) * 100),
  };
}
