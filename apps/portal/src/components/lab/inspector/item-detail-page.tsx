"use client";

import { GameIcon } from "@/components/game/game-icon";
import { QUALITY_COLORS } from "@/components/game/game-tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Gem, Shield, Sparkles, Swords, Zap } from "lucide-react";
import Link from "next/link";

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_ITEM_CLOTH_VEST = {
  id: 211980,
  name: "Algari Competitor's Cloth Vest",
  description: "Forged in the fires of competition.",
  iconName: "inv_chest_cloth_raidmage_s_01",
  quality: 4 as const, // Epic

  // Core Info
  itemLevel: 593,
  requiredLevel: 80,
  binding: "BoP" as "BoP" | "BoE" | "BoU",

  // Classification
  classification: {
    classId: 4,
    className: "Armor",
    subclassId: 1,
    subclassName: "Cloth",
    inventoryType: 5,
    inventoryTypeName: "Chest",
    expansionId: 10,
    expansionName: "The War Within",
  },

  // Armor
  armor: 3847,

  // Primary Stats
  primaryStats: [
    { name: "Intellect", value: 2156, type: "primary" },
    { name: "Stamina", value: 3234, type: "primary" },
  ],

  // Secondary Stats
  secondaryStats: [
    {
      name: "Critical Strike",
      rating: 847,
      budgetPercent: 57,
      percentAtLevel: 2.14,
      diminishedPercent: 2.08,
    },
    {
      name: "Mastery",
      rating: 635,
      budgetPercent: 43,
      percentAtLevel: 1.6,
      diminishedPercent: 1.57,
    },
  ],
  totalSecondaryBudget: 1482,

  // Sockets
  sockets: [{ type: "Prismatic", gem: null }],
  socketBonus: null,

  // Bonus IDs
  bonusIds: [1472, 10256, 10377, 10396, 10873, 11316],
  bonusBreakdown: [
    {
      id: 1472,
      type: "Item Level",
      typeId: 1,
      value: "+13",
      description: "Heroic track base",
    },
    {
      id: 10256,
      type: "Stat Allocation",
      typeId: 2,
      value: "[847, 635]",
      description: "Crit/Mastery",
    },
    {
      id: 10377,
      type: "Socket",
      typeId: 6,
      value: "1 Prismatic",
      description: "Prismatic Socket",
    },
    {
      id: 10396,
      type: "Tertiary",
      typeId: 23,
      value: "-",
      description: "Speed/Leech/Avoid",
    },
    {
      id: 10873,
      type: "Scaling Curve",
      typeId: 11,
      value: "Curve #2157",
      description: "TWW Season 1",
    },
    {
      id: 11316,
      type: "Upgrade Track",
      typeId: 40,
      value: "Champion 4/8",
      description: "Upgrade level",
    },
  ],

  // Upgrade Path
  upgradePath: {
    season: "The War Within Season 1",
    track: "Champion",
    trackRange: "580-593",
    currentLevel: 4,
    maxLevel: 8,
    levels: [
      {
        level: 1,
        itemLevel: 580,
        crestType: "Weathered",
        crestCost: 15,
        flightstoneCost: 120,
        source: "M0, Normal Raid",
      },
      {
        level: 2,
        itemLevel: 584,
        crestType: "Weathered",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
      {
        level: 3,
        itemLevel: 587,
        crestType: "Weathered",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
      {
        level: 4,
        itemLevel: 593,
        crestType: "Carved",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
        current: true,
      },
      {
        level: 5,
        itemLevel: 597,
        crestType: "Carved",
        crestCost: 15,
        flightstoneCost: 120,
        source: "M2-5, Heroic Raid",
      },
      {
        level: 6,
        itemLevel: 600,
        crestType: "Carved",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
      {
        level: 7,
        itemLevel: 603,
        crestType: "Runed",
        crestCost: 15,
        flightstoneCost: 120,
        source: "M6-9, Mythic Raid",
      },
      {
        level: 8,
        itemLevel: 606,
        crestType: "Runed",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
    ],
    nextTracks: [
      {
        name: "Hero Track",
        range: "610-626",
        requirement: "Requires upgrading to Champion 8/8 first",
      },
      {
        name: "Myth Track",
        range: "623-639",
        requirement: "Requires Myth track item as base",
      },
    ],
  },

  // Item Effects
  effects: [],

  // Set Info
  setInfo: null,
  relatedSets: [
    {
      name: 'Mage Tier Set: "Sparks of Living Flame"',
      pieces: ["Helm", "Shoulder", "Chest", "Hands", "Legs"],
    },
    {
      name: 'Warlock Tier Set: "Grimoire of the Nerubian"',
      pieces: ["Helm", "Shoulder", "Chest", "Hands", "Legs"],
    },
    {
      name: 'Priest Tier Set: "Faith\'s Vesture"',
      pieces: ["Helm", "Shoulder", "Chest", "Hands", "Legs"],
    },
  ],

  // Armor Calculation
  armorCalculation: {
    baseArmor: 3847,
    armorType: "Cloth",
    formula: "ItemArmorQuality[iLvl=593].Cloth * QualityMod[Epic] = 3,847",
    physicalDR: 23.4,
  },

  // Spec Usability
  specUsability: {
    primaryStatUsers: [
      {
        className: "Mage",
        specs: [
          { name: "Arcane", usable: true },
          { name: "Fire", usable: true },
          { name: "Frost", usable: true },
        ],
      },
      {
        className: "Warlock",
        specs: [
          { name: "Affliction", usable: true },
          { name: "Demonology", usable: true },
          { name: "Destruction", usable: true },
        ],
      },
      {
        className: "Priest",
        specs: [
          { name: "Discipline", usable: true },
          { name: "Holy", usable: true },
          { name: "Shadow", usable: true },
        ],
      },
    ],
    statPriorityMatch: [
      { spec: "Fire Mage", rating: 4, note: "Crit/Mastery is excellent" },
      { spec: "Frost Mage", rating: 3, note: "Prefers Haste/Crit" },
      { spec: "Shadow Priest", rating: 3, note: "Prefers Haste/Mastery" },
    ],
  },

  // Drop Sources
  dropSources: [
    {
      source: "Nerub-ar Palace",
      difficulty: "Normal",
      baseItemLevel: 571,
      dropChance: "~15%",
    },
    {
      source: "Nerub-ar Palace",
      difficulty: "Heroic",
      baseItemLevel: 584,
      dropChance: "~15%",
    },
    {
      source: "Nerub-ar Palace",
      difficulty: "Mythic",
      baseItemLevel: 597,
      dropChance: "~15%",
    },
    {
      source: "M+ Dungeon End",
      difficulty: "+2",
      baseItemLevel: 584,
      dropChance: "100% (Great Vault)",
    },
    {
      source: "M+ Dungeon End",
      difficulty: "+10",
      baseItemLevel: 597,
      dropChance: "100% (Great Vault)",
    },
    {
      source: "Delves",
      difficulty: "Tier 8",
      baseItemLevel: 584,
      dropChance: "~20%",
    },
    {
      source: "PvP Conquest",
      difficulty: "-",
      baseItemLevel: 580,
      dropChance: "Purchasable",
    },
  ],

  // Item Flags
  flags: [
    { index: 0, value: 0x00000000, description: null },
    { index: 1, value: 0x00002000, description: "ITEM_FLAG_BIND_TO_ACCOUNT" },
    { index: 2, value: 0x00800000, description: "ITEM_FLAG2_NO_DURABILITY" },
    { index: 3, value: 0x00000000, description: null },
    { index: 4, value: 0x00000000, description: null },
  ],

  // Crafting
  craftingInfo: null,
  similarCraftedItems: [
    {
      name: "Weavercloth Vestments",
      itemLevelRange: "580-636",
      profession: "Tailoring",
      recipe: "Pattern: Weavercloth Vestments",
      materials: ["25x Weavercloth", "5x Mystic Null Stone"],
    },
  ],

  // Recommended Gems
  recommendedGems: [
    { name: "Inscribed Sapphire", stats: "+72 Crit / +54 Int" },
    { name: "Deadly Sapphire", stats: "+72 Crit / +54 Crit" },
    { name: "Masterful Sapphire", stats: "+72 Mastery / +54 Mastery" },
  ],

  // Raw Data
  rawData: {
    item: { ID: 211980, ClassID: 4, SubclassID: 1 },
    itemSparse: {
      ID: 211980,
      Name_lang: "Algari Competitor's Cloth Vest",
      ItemLevel: 593,
    },
    itemBonus: [
      { ID: 1472, Type: 1, Value_0: 13 },
      { ID: 10256, Type: 2, Value_0: 847, Value_1: 635 },
    ],
  },

  // SimC String
  simcString:
    "chest=algari_competitors_cloth_vest,id=211980,bonus_id=1472/10256/10377/10396/10873/11316,ilevel=593,gem_id=213467",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatHex(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

function getQualityName(quality: number): string {
  const names: Record<number, string> = {
    0: "Poor",
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Epic",
    5: "Legendary",
    6: "Artifact",
    7: "Heirloom",
  };
  return names[quality] ?? "Unknown";
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ItemHeaderCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  const qualityColor = QUALITY_COLORS[item.quality];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 overflow-hidden rounded-lg border-2"
            style={{ borderColor: qualityColor }}
          >
            <GameIcon iconName={item.iconName} size="large" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-2xl font-bold"
                style={{ color: qualityColor }}
              >
                {item.name}
              </h1>
              <div className="flex items-center gap-1">
                <Badge variant="outline">Item #{item.id}</Badge>
                <CopyButton value={item.id.toString()} />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-yellow-500 font-medium">
                Item Level {item.itemLevel}
              </span>
              <span style={{ color: qualityColor }}>
                {getQualityName(item.quality)} Quality
              </span>
              <span className="text-muted-foreground">
                {item.binding === "BoP" && "Binds when picked up"}
                {item.binding === "BoE" && "Binds when equipped"}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{item.classification.inventoryTypeName}</span>
              <span>{item.classification.subclassName} Armor</span>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">{item.armor}</span>{" "}
                Armor
              </p>
              {item.primaryStats.map((stat) => (
                <p key={stat.name} className="text-sm">
                  +{stat.value.toLocaleString()} {stat.name}
                </p>
              ))}
              {item.secondaryStats.map((stat) => (
                <p key={stat.name} className="text-sm text-green-500">
                  +{stat.rating.toLocaleString()} {stat.name}
                </p>
              ))}
              {item.sockets.map((socket, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  [{socket.type} Socket]
                </p>
              ))}
              <p className="text-sm text-muted-foreground">
                Requires Level {item.requiredLevel}
              </p>
              {item.description && (
                <p className="text-sm text-yellow-500 italic mt-2">
                  &quot;{item.description}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassificationCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Classification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Class</p>
            <p className="font-medium">
              {item.classification.className} ({item.classification.classId})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Subclass</p>
            <p className="font-medium">
              {item.classification.subclassName} (
              {item.classification.subclassId})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Inventory Type</p>
            <p className="font-medium">
              {item.classification.inventoryTypeName} (
              {item.classification.inventoryType})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Quality</p>
            <p className="font-medium">
              {getQualityName(item.quality)} ({item.quality})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Expansion</p>
            <p className="font-medium">
              {item.classification.expansionName} (
              {item.classification.expansionId})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Binding</p>
            <p className="font-medium">
              {item.binding === "BoP" && "Binds when picked up (1)"}
              {item.binding === "BoE" && "Binds when equipped (2)"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBreakdownCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stat Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Stats */}
        <div>
          <h4 className="text-sm font-medium mb-2">Primary Stats</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stat</TableHead>
                <TableHead className="text-right">Base Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.primaryStats.map((stat) => (
                <TableRow key={stat.name}>
                  <TableCell>{stat.name}</TableCell>
                  <TableCell className="text-right">
                    {stat.value.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Secondary Stats */}
        <div>
          <h4 className="text-sm font-medium mb-2">Secondary Stats</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stat</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Budget %</TableHead>
                <TableHead className="text-right">@ Level 80</TableHead>
                <TableHead className="text-right">Diminished</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.secondaryStats.map((stat) => (
                <TableRow key={stat.name}>
                  <TableCell>{stat.name}</TableCell>
                  <TableCell className="text-right">
                    {stat.rating.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.budgetPercent}%
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.percentAtLevel}%
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.diminishedPercent}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-2">
            Total Secondary Budget: {item.totalSecondaryBudget.toLocaleString()}{" "}
            (100%)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BonusIdsCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonus IDs</CardTitle>
        <CardDescription>
          Current Bonus IDs: [{item.bonusIds.join(", ")}]
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {item.bonusBreakdown.map((bonus) => (
              <TableRow key={bonus.id}>
                <TableCell className="font-mono">{bonus.id}</TableCell>
                <TableCell>
                  {bonus.type} ({bonus.typeId})
                </TableCell>
                <TableCell className="font-mono">{bonus.value}</TableCell>
                <TableCell className="text-muted-foreground">
                  {bonus.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UpgradePathCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  const { upgradePath } = item;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade Path</CardTitle>
        <CardDescription>
          Season: {upgradePath.season} | Track: {upgradePath.track} (
          {upgradePath.trackRange}) | Current Level: {upgradePath.currentLevel}/
          {upgradePath.maxLevel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>iLvl</TableHead>
              <TableHead>Crest Cost</TableHead>
              <TableHead>Flightstone</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upgradePath.levels.map((level) => (
              <TableRow
                key={level.level}
                className={level.current ? "bg-primary/10" : ""}
              >
                <TableCell>
                  {level.level}/{upgradePath.maxLevel}
                  {level.current && " ◄"}
                </TableCell>
                <TableCell className="font-medium">{level.itemLevel}</TableCell>
                <TableCell>
                  {level.crestCost} {level.crestType}
                </TableCell>
                <TableCell>{level.flightstoneCost}</TableCell>
                <TableCell className="text-muted-foreground">
                  {level.source || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {upgradePath.nextTracks.length > 0 && (
          <div className="text-sm space-y-1">
            {upgradePath.nextTracks.map((track) => (
              <p key={track.name} className="text-muted-foreground">
                <span className="font-medium">{track.name}</span> ({track.range}
                ): {track.requirement}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SocketsCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="h-5 w-5" />
          Sockets & Gems
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.sockets.length > 0 ? (
          <div className="space-y-2">
            {item.sockets.map((socket, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm p-2 rounded border"
              >
                <div className="w-6 h-6 rounded border-2 border-dashed border-muted-foreground flex items-center justify-center">
                  <Gem className="h-3 w-3 text-muted-foreground" />
                </div>
                <span>
                  Socket {i + 1}: [{socket.type}] -{" "}
                  {socket.gem ?? (
                    <span className="text-muted-foreground">Empty</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="py-4 border-0">
            <EmptyMedia variant="icon">
              <Gem className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Sockets</EmptyTitle>
              <EmptyDescription>This item has no gem sockets.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {item.recommendedGems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Recommended Gems (by stat priority):
            </h4>
            <ul className="space-y-1 text-sm">
              {item.recommendedGems.map((gem) => (
                <li key={gem.name} className="text-muted-foreground">
                  {gem.name} ({gem.stats})
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.socketBonus && (
          <p className="text-sm">
            <span className="text-muted-foreground">Socket Bonus:</span>{" "}
            {item.socketBonus}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SetBonusesCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Set Bonuses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.setInfo ? (
          <div>Set info here</div>
        ) : (
          <Empty className="py-4 border-0">
            <EmptyMedia variant="icon">
              <Sparkles className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Set Bonus</EmptyTitle>
              <EmptyDescription>
                This item is not part of a tier set.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {item.relatedSets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Related Sets:</h4>
            <ul className="space-y-2 text-sm">
              {item.relatedSets.map((set) => (
                <li key={set.name}>
                  <p className="font-medium">{set.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {set.pieces.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ArmorCalculationCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Armor Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground">Base Armor</p>
            <p className="font-medium">
              {item.armorCalculation.baseArmor.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Armor Type</p>
            <p className="font-medium">{item.armorCalculation.armorType}</p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground">Armor Formula:</p>
          <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
            {item.armorCalculation.formula}
          </code>
        </div>

        <div>
          <p className="text-muted-foreground">Damage Reduction vs Level 80:</p>
          <p className="font-medium">
            Physical DR: {item.armorCalculation.physicalDR}% (with this piece
            only)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SpecUsabilityCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Spec Usability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Primary Stat Users</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Specs Using Intellect Cloth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.specUsability.primaryStatUsers.map((classInfo) => (
                <TableRow key={classInfo.className}>
                  <TableCell>{classInfo.className}</TableCell>
                  <TableCell>
                    {classInfo.specs.map((spec, i) => (
                      <span key={spec.name}>
                        {i > 0 && ", "}
                        <span
                          className={
                            spec.usable ? "text-green-500" : "text-red-500"
                          }
                        >
                          {spec.usable ? "✓" : "✗"} {spec.name}
                        </span>
                      </span>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Stat Priority Match:</h4>
          <ul className="space-y-1 text-sm">
            {item.specUsability.statPriorityMatch.map((match) => (
              <li key={match.spec} className="flex items-center gap-2">
                <span>{match.spec}:</span>
                <span className="text-yellow-500">
                  {"★".repeat(match.rating)}
                  {"☆".repeat(5 - match.rating)}
                </span>
                <span className="text-muted-foreground">({match.note})</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function DropSourcesCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drop Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Base iLvl</TableHead>
              <TableHead>Drop Chance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {item.dropSources.map((source, i) => (
              <TableRow key={i}>
                <TableCell>{source.source}</TableCell>
                <TableCell>{source.difficulty}</TableCell>
                <TableCell>{source.baseItemLevel}</TableCell>
                <TableCell className="text-muted-foreground">
                  {source.dropChance}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ItemFlagsCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {item.flags.map((flag) => (
          <div key={flag.index} className="flex items-center gap-2">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              Flags[{flag.index}]: {formatHex(flag.value)}
            </code>
            {flag.description && (
              <span className="text-muted-foreground">
                - {flag.description}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CraftingCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crafting Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.craftingInfo ? (
          <div>Crafting info here</div>
        ) : (
          <Empty className="py-4 border-0">
            <EmptyHeader>
              <EmptyTitle className="text-base">Not Craftable</EmptyTitle>
              <EmptyDescription>
                This item cannot be crafted by players.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {item.similarCraftedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Similar Crafted Items:</h4>
            {item.similarCraftedItems.map((crafted) => (
              <div
                key={crafted.name}
                className="text-sm p-2 rounded border space-y-1"
              >
                <p className="font-medium">
                  {crafted.name} (iLvl {crafted.itemLevelRange},{" "}
                  {crafted.profession})
                </p>
                <p className="text-muted-foreground text-xs">
                  Recipe: {crafted.recipe}
                </p>
                <p className="text-muted-foreground text-xs">
                  Materials: {crafted.materials.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RawDataCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  const sections = [
    { key: "item", label: "Item.csv row", data: item.rawData.item },
    {
      key: "itemSparse",
      label: "ItemSparse.csv row",
      data: item.rawData.itemSparse,
    },
    {
      key: "itemBonus",
      label: `ItemBonus.csv rows (${item.rawData.itemBonus.length})`,
      data: item.rawData.itemBonus,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Data Inspector</CardTitle>
        <CardDescription>Collapsible sections for raw CSV data</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sections.map((section) => (
            <AccordionItem key={section.key} value={section.key}>
              <AccordionTrigger className="text-sm">
                {section.label}
              </AccordionTrigger>
              <AccordionContent>
                <CodeBlock
                  code={JSON.stringify(section.data, null, 2)}
                  language="json"
                  maxHeight="max-h-64"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function SimulationIntegrationCard({
  item,
}: {
  item: typeof MOCK_ITEM_CLOTH_VEST;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Compare in Top Gear
          </Button>
          <Button variant="outline" size="sm">
            Add to Simulation
          </Button>
          <Button variant="outline" size="sm">
            Export SimC String
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">SimC Item String:</p>
          <CodeBlock code={item.simcString} language="text" showCopy={true} />
        </div>
      </CardContent>
    </Card>
  );
}

function ItemEffectsCard({ item }: { item: typeof MOCK_ITEM_CLOTH_VEST }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Item Effects
        </CardTitle>
        <CardDescription>
          On-equip and on-use effects triggered by this item
        </CardDescription>
      </CardHeader>
      <CardContent>
        {item.effects.length > 0 ? (
          <div className="space-y-3">
            {item.effects.map((effect, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-green-500">{effect}</p>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="py-4 border-0">
            <EmptyMedia variant="icon">
              <Zap className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Item Effects</EmptyTitle>
              <EmptyDescription>
                This item has no special on-equip or on-use effects.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface ItemDetailPageProps {
  itemId: string;
}

export function ItemDetailPage({ itemId }: ItemDetailPageProps) {
  // In a real implementation, we would fetch data based on itemId
  // For now, we use mock data
  const item = MOCK_ITEM_CLOTH_VEST;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lab/inspector/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inspector
          </Link>
        </Button>
      </div>

      {/* Header */}
      <ItemHeaderCard item={item} />

      {/* Classification & Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ClassificationCard item={item} />
        <StatBreakdownCard item={item} />
      </div>

      {/* Bonus IDs */}
      <BonusIdsCard item={item} />

      {/* Upgrade Path */}
      <UpgradePathCard item={item} />

      {/* Sockets & Sets */}
      <div className="grid gap-6 md:grid-cols-2">
        <SocketsCard item={item} />
        <SetBonusesCard item={item} />
      </div>

      {/* Item Effects */}
      <ItemEffectsCard item={item} />

      {/* Armor & Spec Usability */}
      <div className="grid gap-6 md:grid-cols-2">
        <ArmorCalculationCard item={item} />
        <SpecUsabilityCard item={item} />
      </div>

      {/* Drop Sources */}
      <DropSourcesCard item={item} />

      {/* Flags & Crafting */}
      <div className="grid gap-6 md:grid-cols-2">
        <ItemFlagsCard item={item} />
        <CraftingCard item={item} />
      </div>

      {/* Raw Data & Simulation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RawDataCard item={item} />
        <SimulationIntegrationCard item={item} />
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function ItemDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="space-y-1 mt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* More Skeletons */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
