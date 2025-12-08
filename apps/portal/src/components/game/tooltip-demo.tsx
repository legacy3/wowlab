"use client";

import {
  ItemTooltip,
  SpellTooltip,
  type ItemTooltipData,
  type SpellTooltipData,
  QUALITY_COLORS,
} from "./game-tooltip";
import { cn } from "@/lib/utils";

// Mock Items
const MOCK_ITEMS: ItemTooltipData[] = [
  {
    name: "Thunderfury, Blessed Blade of the Windseeker",
    quality: 5,
    itemLevel: 80,
    binding: "BoP",
    slot: "Main Hand",
    armorType: "Sword",
    stats: [
      { name: "Agility", value: 5 },
      { name: "Stamina", value: 8 },
      { name: "Fire Resistance", value: 8 },
      { name: "Nature Resistance", value: 9 },
    ],
    effects: [
      {
        isEquip: true,
        text: "Chance on hit: Blasts your enemy with lightning, dealing 300 Nature damage and then jumping to additional nearby enemies.",
      },
    ],
    iconName: "inv_sword_39",
  },
  {
    name: "Frostmourne",
    quality: 6,
    itemLevel: 284,
    binding: "BoP",
    slot: "Two-Hand",
    armorType: "Sword",
    stats: [
      { name: "Strength", value: 223 },
      { name: "Stamina", value: 198 },
    ],
    secondaryStats: [
      { name: "Critical Strike", value: 114 },
      { name: "Haste", value: 89 },
    ],
    effects: [
      {
        isEquip: true,
        text: "Your attacks have a chance to steal the soul of your target, dealing Shadow damage and healing you for the damage dealt.",
      },
    ],
    requiredLevel: 80,
    iconName: "inv_sword_122",
  },
  {
    name: "Hearthstone",
    quality: 1,
    itemLevel: 1,
    binding: "BoP",
    effects: [
      {
        isUse: true,
        text: "Returns you to your Hearthstone location. Speak to an Innkeeper in a different place to change your home location.",
      },
    ],
    iconName: "inv_misc_rune_01",
  },
  {
    name: "Worn Shortsword",
    quality: 0,
    itemLevel: 2,
    slot: "Main Hand",
    armorType: "Sword",
    stats: [{ name: "Stamina", value: 1 }],
    sellPrice: { gold: 0, silver: 0, copper: 23 },
    iconName: "inv_sword_04",
  },
  {
    name: "Tier 2 Chest",
    quality: 4,
    itemLevel: 76,
    binding: "BoP",
    slot: "Chest",
    armorType: "Plate",
    armor: 967,
    stats: [
      { name: "Strength", value: 31 },
      { name: "Stamina", value: 29 },
    ],
    secondaryStats: [
      { name: "Critical Strike", value: 1 },
      { name: "Hit Rating", value: 1 },
    ],
    setName: "Battlegear of Wrath (0/8)",
    setPieces: [
      { name: "Helm of Wrath", collected: false },
      { name: "Pauldrons of Wrath", collected: false },
      { name: "Breastplate of Wrath", collected: true },
      { name: "Gauntlets of Wrath", collected: false },
      { name: "Legplates of Wrath", collected: false },
      { name: "Sabatons of Wrath", collected: false },
      { name: "Bracers of Wrath", collected: false },
      { name: "Waistband of Wrath", collected: false },
    ],
    setBonuses: [
      {
        required: 3,
        text: "Increases the damage done by your Revenge ability by 30%.",
        active: false,
      },
      { required: 5, text: "Gives you a 30% chance to parry.", active: false },
      {
        required: 8,
        text: "When you parry an attack, you get Flurry, increasing attack speed by 30%.",
        active: false,
      },
    ],
    requiredLevel: 60,
    iconName: "inv_chest_plate03",
  },
  {
    name: "Ashkandi, Greatsword of the Brotherhood",
    quality: 4,
    itemLevel: 77,
    binding: "BoP",
    slot: "Two-Hand",
    armorType: "Sword",
    stats: [
      { name: "Strength", value: 86 },
      { name: "Stamina", value: 49 },
    ],
    requiredLevel: 60,
    sellPrice: { gold: 15, silver: 42, copper: 87 },
    iconName: "inv_sword_50",
  },
  {
    name: "Flask of the Titans",
    quality: 3,
    itemLevel: 60,
    effects: [
      {
        isUse: true,
        text: "Increases maximum health by 1200 for 2 hrs. You can only have the effect of one flask at a time.",
      },
    ],
    iconName: "inv_potion_62",
  },
];

// Mock Spells
const MOCK_SPELLS: SpellTooltipData[] = [
  {
    name: "Fireball",
    rank: "Rank 12",
    castTime: "3 sec cast",
    range: "35 yd range",
    cost: "425 Mana",
    school: "fire",
    description:
      "Hurls a fiery ball that causes 596 to 760 Fire damage and an additional 76 Fire damage over 8 sec.",
    iconName: "spell_fire_flamebolt",
  },
  {
    name: "Mortal Strike",
    rank: "Rank 6",
    castTime: "Instant",
    cooldown: "6 sec",
    cost: "30 Rage",
    school: "physical",
    description:
      "A vicious strike that deals 210% weapon damage plus 380 and wounds the target, reducing the effectiveness of any healing by 50% for 10 sec.",
    iconName: "ability_warrior_savageblow",
  },
  {
    name: "Holy Light",
    rank: "Rank 11",
    castTime: "2.5 sec cast",
    range: "40 yd range",
    cost: "840 Mana",
    school: "holy",
    description:
      "Heals a friendly target for 2196 to 2446. Healing targets below 50% health will trigger Beacon of Light.",
    iconName: "spell_holy_holybolt",
  },
  {
    name: "Shadow Bolt",
    rank: "Rank 11",
    castTime: "3 sec cast",
    range: "30 yd range",
    cost: "420 Mana",
    school: "shadow",
    description:
      "Sends a shadowy bolt at the enemy, causing 544 to 607 Shadow damage.",
    iconName: "spell_shadow_shadowbolt",
  },
  {
    name: "Frostbolt",
    rank: "Rank 13",
    castTime: "3 sec cast",
    range: "30 yd range",
    cost: "330 Mana",
    school: "frost",
    description:
      "Launches a bolt of frost at the enemy, causing 597 to 647 Frost damage and slowing movement speed by 40% for 9 sec.",
    iconName: "spell_frost_frostbolt02",
  },
  {
    name: "Wrath",
    rank: "Rank 10",
    castTime: "2 sec cast",
    range: "30 yd range",
    cost: "255 Mana",
    school: "nature",
    description:
      "Causes 431 to 487 Nature damage to the target. Damage increased on targets affected by your Moonfire or Insect Swarm.",
    iconName: "spell_nature_abolishmagic",
  },
  {
    name: "Arcane Missiles",
    rank: "Rank 10",
    castTime: "5 sec channeled",
    range: "30 yd range",
    cost: "740 Mana",
    school: "arcane",
    description:
      "Launches Arcane Missiles at the enemy, causing 264 Arcane damage every second for 5 sec.",
    iconName: "spell_nature_starfall",
  },
  {
    name: "Execute",
    castTime: "Instant",
    cost: "15 Rage",
    school: "physical",
    description:
      "Attempt to finish off a wounded foe, causing physical damage based on your weapon damage plus additional damage for each point of Rage you have. Only usable on enemies that have 20% or less health.",
    iconName: "inv_sword_48",
  },
];

// Demo Component
export function TooltipDemo() {
  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Items Section */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-foreground">
          Item Tooltips
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Hover over items to see their tooltips
        </p>
        <div className="flex flex-wrap gap-3">
          {MOCK_ITEMS.map((item, index) => (
            <ItemTooltip key={index} item={item}>
              <button
                className={cn(
                  "rounded border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors",
                  "hover:bg-accent",
                )}
                style={{ color: QUALITY_COLORS[item.quality] }}
              >
                [{item.name}]
              </button>
            </ItemTooltip>
          ))}
        </div>
      </section>

      {/* Spells Section */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-foreground">
          Spell Tooltips
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Hover over spells to see their tooltips
        </p>
        <div className="flex flex-wrap gap-3">
          {MOCK_SPELLS.map((spell, index) => (
            <SpellTooltip key={index} spell={spell}>
              <button
                className={cn(
                  "rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors",
                  "hover:bg-accent",
                )}
              >
                {spell.name}
              </button>
            </SpellTooltip>
          ))}
        </div>
      </section>

      {/* Icon Demo */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-foreground">
          With Icon Triggers
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Icons can also trigger tooltips
        </p>
        <div className="flex flex-wrap gap-4">
          {MOCK_ITEMS.slice(0, 4).map(
            (item, index) =>
              item.iconName && (
                <ItemTooltip key={index} item={item}>
                  <button
                    className={cn(
                      "overflow-hidden rounded border-2 transition-all",
                      "hover:scale-105 hover:shadow-lg",
                    )}
                    style={{
                      borderColor: QUALITY_COLORS[item.quality],
                      boxShadow: `0 0 8px ${QUALITY_COLORS[item.quality]}40`,
                    }}
                  >
                    <img
                      src={`https://api.wowlab.gg/functions/v1/icons/large/${item.iconName}.jpg`}
                      alt={item.name}
                      className="h-14 w-14"
                    />
                  </button>
                </ItemTooltip>
              ),
          )}
          {MOCK_SPELLS.slice(0, 4).map(
            (spell, index) =>
              spell.iconName && (
                <SpellTooltip key={index} spell={spell}>
                  <button
                    className={cn(
                      "overflow-hidden rounded border-2 border-[#3a3a3a] transition-all",
                      "hover:scale-105 hover:border-white/50 hover:shadow-lg",
                    )}
                  >
                    <img
                      src={`https://api.wowlab.gg/functions/v1/icons/large/${spell.iconName}.jpg`}
                      alt={spell.name}
                      className="h-14 w-14"
                    />
                  </button>
                </SpellTooltip>
              ),
          )}
        </div>
      </section>
    </div>
  );
}
