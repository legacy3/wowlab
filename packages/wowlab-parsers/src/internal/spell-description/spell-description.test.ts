import { describe, expect, it } from "vitest";

import { tokenize } from "./lexer";
import { parse } from "./parser";

function parseDescription(input: string) {
  const lexResult = tokenize(input);
  return parse(input, lexResult);
}

function expectNoErrors(input: string) {
  const result = parseDescription(input);
  expect(result.lexErrors).toEqual([]);
  expect(result.errors).toEqual([]);
  return result;
}

describe("Effect Variables", () => {
  describe("$s - Effect base points", () => {
    it("parses $s1 through $s9", () => {
      expectNoErrors("Deals $s1 damage.");
      expectNoErrors("Heals for $s2 and $s3.");
      expectNoErrors("Increases by $s9%.");
    });
  });

  describe("$m - Effect base points (alternate)", () => {
    it("parses $m1 through $m9", () => {
      expectNoErrors("Deals $m1 damage.");
      expectNoErrors("${$m3/10} Astral Power.");
    });
  });

  describe("$M - Effect max value", () => {
    it("parses $M1 through $M9", () => {
      expectNoErrors("Conjures $M1 loaves.");
    });
  });

  describe("$o - Total periodic damage/healing", () => {
    it("parses $o1 through $o9", () => {
      expectNoErrors("Heals the target for $o1 over $d.");
      expectNoErrors("Deals $o2 Shadow damage over the duration.");
    });
  });

  describe("$t - Tick/period interval", () => {
    it("parses $t1 through $t9", () => {
      expectNoErrors("Inflicts damage every $t1 sec.");
      expectNoErrors("Ticks every $t2 seconds for $d.");
    });
  });

  describe("$a - Effect radius", () => {
    it("parses $a1 through $a9", () => {
      expectNoErrors("All enemies within $a1 yards.");
      expectNoErrors("Affects targets in a $a2 yard radius.");
    });
  });

  describe("$A - Effect max radius", () => {
    it("parses $A1 through $A9", () => {
      expectNoErrors("Up to $A1 yards away.");
    });
  });

  describe("$e - Points per resource", () => {
    it("parses $e1 through $e9", () => {
      expectNoErrors("For each point consumed, deals $e1 damage.");
    });
  });

  describe("$w - Effect amplitude", () => {
    it("parses $w1 through $w9", () => {
      expectNoErrors("Amplitude of $w1.");
    });
  });

  describe("$x - Chain targets", () => {
    it("parses $x1 through $x9", () => {
      expectNoErrors("Jumps to $x1 additional targets.");
      expectNoErrors("Affects up to $x1 targets.");
    });
  });

  describe("$bc - Bonus coefficient", () => {
    it("parses $bc1 through $bc9", () => {
      expectNoErrors("${$bc1*$SP} damage.");
    });
  });

  describe("$q - Effect misc value", () => {
    it("parses $q1 through $q9", () => {
      expectNoErrors("Misc value $q1.");
    });
  });
});

describe("Spell-Level Variables", () => {
  describe("$d - Duration", () => {
    it("parses duration", () => {
      expectNoErrors("Lasts $d.");
      expectNoErrors("For $d seconds.");
    });
  });

  describe("$d1-$d3 - Indexed duration", () => {
    it("parses indexed durations", () => {
      expectNoErrors("First duration $d1, second $d2.");
    });
  });

  describe("$n - Proc charges / stack count", () => {
    it("parses stack count", () => {
      expectNoErrors("Strikes $n times.");
      expectNoErrors("Up to $n stacks.");
    });
  });

  describe("$u - Max stacks", () => {
    it("parses max stacks", () => {
      expectNoErrors("Stacking up to $u times.");
    });
  });

  describe("$h - Proc chance", () => {
    it("parses proc chance", () => {
      expectNoErrors("Has a $h% chance to proc.");
    });
  });

  describe("$r - Range", () => {
    it("parses range", () => {
      expectNoErrors("Within $r yards.");
    });
  });

  describe("$i - Max affected targets", () => {
    it("parses max targets", () => {
      expectNoErrors("Affects up to $i enemies.");
    });
  });

  describe("$p - Power cost", () => {
    it("parses power costs", () => {
      expectNoErrors("Costs $p1 mana.");
    });
  });

  describe("$z - Zone name", () => {
    it("parses zone name", () => {
      expectNoErrors("Only works in $z.");
    });
  });
});

describe("Cross-Spell References", () => {
  it("parses spell ID with effect suffix", () => {
    expectNoErrors("Increases damage by $424509s1%.");
    expectNoErrors("Lasts for $214621d.");
    expectNoErrors("Ticks every $8188t1 sec.");
  });

  it("parses spell ID with different suffixes", () => {
    expectNoErrors("$76657m1 mastery bonus.");
    expectNoErrors("$164812o2 total damage.");
    expectNoErrors("Within $8146a1 yards.");
    expectNoErrors("$327942h% proc chance.");
    expectNoErrors("$85739u max stacks.");
    expectNoErrors("$331850i targets.");
    expectNoErrors("$296146bc1 coefficient.");
  });

  it("handles large spell IDs", () => {
    expectNoErrors("$1230959s1 value.");
    expectNoErrors("$1219035d duration.");
  });
});

describe("Player/Character Variables", () => {
  it("parses spell power", () => {
    expectNoErrors("${$SP*0.5} healing.");
    expectNoErrors("${$sp*2.52} damage.");
  });

  it("parses attack power", () => {
    expectNoErrors("${$AP*0.3} damage.");
    expectNoErrors("${$ap*($s2/100)} bonus.");
  });

  it("parses ranged attack power", () => {
    expectNoErrors("${$RAP*0.144} damage.");
  });

  it("parses max health", () => {
    expectNoErrors("${$MHP*$s1/100} absorb.");
    expectNoErrors("${$mhp*$s2/100} shield.");
  });

  it("parses player level", () => {
    expectNoErrors("$?$gt($PL,85)[high level][low level]");
    expectNoErrors("${($pl-1)*3+10} base value.");
  });

  it("parses intellect", () => {
    expectNoErrors("$INT bonus intellect.");
  });
});

describe("Conditional Expressions", () => {
  describe("Spell known conditionals ($?s)", () => {
    it("parses basic spell known check", () => {
      expectNoErrors("$?s424509[Bonus text.][Default text.]");
    });

    it("parses spell known with embedded variables", () => {
      expectNoErrors(
        "$?s424509[Increases damage by $424509s1% for $214621d.][.]",
      );
    });
  });

  describe("Aura present conditionals ($?a)", () => {
    it("parses basic aura check", () => {
      expectNoErrors("$?a410673[Has buff.][No buff.]");
    });

    it("parses empty else branch", () => {
      expectNoErrors("$?a190493[Extra damage.][]");
    });
  });

  describe("Class conditionals ($?c)", () => {
    it("parses class check", () => {
      expectNoErrors("$?c3[Hunters gain][Gain] bonus.");
    });
  });

  describe("Player condition conditionals ($?pc)", () => {
    it("parses player condition", () => {
      expectNoErrors("$?pc117960[${1}][${0}]");
    });
  });

  describe("Chained conditionals", () => {
    it("parses multiple chained conditions", () => {
      expectNoErrors("$?a410673[text1]?a383303[text2]?a187880[text3][]");
    });
  });

  describe("OR conditionals", () => {
    it("parses OR conditions with pipe", () => {
      expectNoErrors("$?a137011|a137034|a137023[any of these][]");
    });

    it("parses complex OR conditions", () => {
      expectNoErrors("$?a137011|a137034|a137023|a137025[${$293164s5}][${-1}]");
    });
  });

  describe("Nested conditionals", () => {
    it("parses conditionals inside conditionals", () => {
      expectNoErrors("$?s231032[$?a372567[Double effect.][Single effect.]][]");
    });
  });
});

describe("Math Functions", () => {
  describe("$gt - Greater than", () => {
    it("parses greater than comparison", () => {
      expectNoErrors("$?$gt($SP,$AP)[spell][melee]");
      expectNoErrors("${$gt($<melee>,$<spell>)}");
    });
  });

  describe("$gte - Greater than or equal", () => {
    it("parses gte comparison", () => {
      expectNoErrors("${$gte($pl,85)*20}");
    });
  });

  describe("$lt - Less than", () => {
    it("parses less than comparison", () => {
      expectNoErrors("${$lt($pl,100)*50}");
    });
  });

  describe("$lte - Less than or equal", () => {
    it("parses lte comparison", () => {
      expectNoErrors("${$lte($s1,50)}");
    });
  });

  describe("$cond - Ternary conditional", () => {
    it("parses basic conditional", () => {
      expectNoErrors("${$cond($gt($SP,$AP),$SP,$AP)}");
    });

    it("parses conditional with expressions", () => {
      expectNoErrors("${$cond($gt($SP,$AP),$SP*2.52,$AP*2.52)*(1+$@versadmg)}");
    });
  });

  describe("$max - Maximum", () => {
    it("parses max function", () => {
      expectNoErrors("${$max($s1,100)}");
      expectNoErrors("${$max(($<coeff>*$AP),1)}%");
    });
  });

  describe("$min - Minimum", () => {
    it("parses min function", () => {
      expectNoErrors("${$min($pl,60)}");
      expectNoErrors("${0.5+$min($pl,20)*0.025}");
    });
  });

  describe("$clamp - Clamp to range", () => {
    it("parses clamp function", () => {
      expectNoErrors("${$clamp($s1,10,25)}");
      expectNoErrors("${$clamp($<cooldownValue>,10,25)}.1");
    });
  });

  describe("$floor - Floor", () => {
    it("parses floor function", () => {
      expectNoErrors("${$floor($s1/100)}");
    });
  });
});

describe("Expression Blocks", () => {
  describe("${...} - Evaluated expressions", () => {
    it("parses simple expressions", () => {
      expectNoErrors("${$s1/100}");
      expectNoErrors("${$s2/10}");
    });

    it("parses complex arithmetic", () => {
      expectNoErrors("${$SP*2.52}");
      expectNoErrors("${($s1+3320)/-100}");
    });

    it("parses expressions with multipliers", () => {
      expectNoErrors("${$ap*($s2/100)*($321538d/$321538t1)}");
    });

    it("parses nested parentheses", () => {
      expectNoErrors("${(1+$382201s3/100)*$s2}");
    });
  });

  describe("$<varname> - Custom variables", () => {
    it("parses custom variable references", () => {
      expectNoErrors("Deals $<damage> damage.");
      expectNoErrors("Heals for $<healing>.");
    });

    it("parses custom variables in expressions", () => {
      expectNoErrors("${$<power>*$s2/100*(1+$@versadmg)}");
      expectNoErrors("${$ap*$<bmMastery>*$<serrated>}");
    });
  });

  describe("Numeric formatting", () => {
    it("parses decimal place specifiers", () => {
      expectNoErrors("${$s1/100}.1");
      expectNoErrors("${$s1/100}.2");
    });
  });
});

describe("Pluralization", () => {
  describe("$l - Lowercase pluralization", () => {
    it("parses basic pluralization", () => {
      expectNoErrors("$s2 combo $lpoint:points;");
      expectNoErrors("$s1 $lloaf:loaves; of bread");
    });

    it("parses complex pluralization", () => {
      expectNoErrors("$s1 $lCompact Harvest Reaper:Compact Harvest Reapers;");
      expectNoErrors("$lattack:attacks;");
    });
  });

  describe("$L - Capitalized pluralization", () => {
    it("parses capitalized pluralization", () => {
      expectNoErrors("$Lstack:stacks;");
      expectNoErrors("$Lpoint:points;");
    });
  });
});

describe("Gender Forms", () => {
  describe("$g - Lowercase gender", () => {
    it("parses basic gender forms", () => {
      expectNoErrors("$ghis:her; damage");
      expectNoErrors("$ghe:she; attacks");
      expectNoErrors("$ghim:her; target");
    });

    it("parses reflexive gender forms", () => {
      expectNoErrors("$ghimself:herself;");
    });
  });

  describe("$G - Capitalized gender", () => {
    it("parses capitalized gender forms", () => {
      expectNoErrors("$Ghis:her; damage");
      expectNoErrors("$Ghim:her; target");
    });
  });
});

describe("Special @ Variables", () => {
  describe("$@spelldesc - Spell description include", () => {
    it("parses spell description reference", () => {
      expectNoErrors("$@spelldesc8679");
      expectNoErrors("$@spelldesc248198");
    });
  });

  describe("$@spellname - Spell name include", () => {
    it("parses spell name reference", () => {
      expectNoErrors("$@spellname118812");
    });
  });

  describe("$@spellaura - Aura description", () => {
    it("parses aura description reference", () => {
      expectNoErrors("$@spellaura12345");
    });
  });

  describe("$@versadmg - Versatility multiplier", () => {
    it("parses versatility reference", () => {
      expectNoErrors("${$s1*(1+$@versadmg)}");
      expectNoErrors("${$SP*2.52*(1+$@versadmg)*$pctD}");
    });
  });

  describe("Other @ variables", () => {
    it("parses class reference", () => {
      expectNoErrors("$@class");
    });

    it("parses loot spec", () => {
      expectNoErrors("$@lootspec");
    });

    it("parses trait entry rank", () => {
      expectNoErrors("$@traitentryrank");
    });
  });
});

describe("Enchant Variables", () => {
  it("parses enchant coefficient", () => {
    expectNoErrors("Increases by $ec1.");
  });

  it("parses enchant max item level", () => {
    expectNoErrors("Cannot be applied to items higher than level $ecix.");
  });

  it("parses enchant duration", () => {
    expectNoErrors("Lasts $ecd.");
  });
});

describe("Miscellaneous Variables", () => {
  it("parses maxcast", () => {
    expectNoErrors("Ineffective above level $maxcast.");
    expectNoErrors("Cannot affect targets above level $maxcast.");
  });

  it("parses pctD", () => {
    expectNoErrors("${$SP*2*$pctD}");
  });

  it("parses weapon damage", () => {
    expectNoErrors("$W weapon damage.");
    expectNoErrors("$W2 offhand damage.");
  });

  it("parses counter max", () => {
    expectNoErrors("Must be level $ctrmax2067 or lower.");
  });
});

describe("UI Formatting Codes", () => {
  it("parses color codes", () => {
    expectNoErrors("|cFFFFFFFFGenerates $s2 Holy Power.|r");
  });

  it("parses color with variables", () => {
    expectNoErrors("|cFFFFFFFFAwards $s2 combo $lpoint:points;.|r");
  });

  it("handles line breaks", () => {
    expectNoErrors("Line one.\r\n\r\nLine two.");
  });
});

describe("Complex Real-World Examples", () => {
  it("parses Healing Surge description", () => {
    const desc =
      "A quick surge of healing energy that restores $s1 of a friendly target's health.$?a410673[\r\n\r\n|cFFFFFFFFConsumes Stormweaver for increased cast speed and healing.|r]?a383303[\r\n\r\n|cFFFFFFFFConsumes Maelstrom Weapon for increased cast speed and healing.|r]?a187880[\r\n\r\n|cFFFFFFFFConsumes Maelstrom Weapon for increased cast speed.|r][]";
    expectNoErrors(desc);
  });

  it("parses Mind Blast description", () => {
    const desc =
      "Blasts the target's mind for $s1 Shadow damage$?s424509[ and increases your spell damage to the target by $424509s1% for $214621d.][.]$?s137033[\r\n\r\n|cFFFFFFFFGenerates ${$s2/100} Insanity.|r][]";
    expectNoErrors(desc);
  });

  it("parses Windfury Totem description", () => {
    const desc =
      "Summons a totem at your feet for $d. Party members within $?s382201[${(1+$382201s3/100)*$s2}][$s2] yds have a $327942h% chance when they auto-attack to swing an extra time.";
    expectNoErrors(desc);
  });

  it("parses Ambush description", () => {
    const desc =
      "Ambush the target, causing $s1 Physical damage.$?s383281[\r\n\r\nHas a $193315s3% chance to hit an additional time, making your next Pistol Shot half cost and double damage.][]\r\n\r\n|cFFFFFFFFAwards $s2 combo $lpoint:points;$?s383281[ each time it strikes][].|r";
    expectNoErrors(desc);
  });

  it("parses Regrowth description", () => {
    const desc =
      "Heals a friendly target for $s1 and another ${$o2*$<mult>} over $d.$?s231032[ Initial heal has a $231032s1% increased chance for a critical effect if the target is already affected by Regrowth.][]$?s24858|s197625[ Usable while in Moonkin Form.][]$?s33891[\r\n\r\n|C0033AA11Tree of Life: Instant cast.|R][]";
    expectNoErrors(desc);
  });

  it("parses Whirlwind description", () => {
    const desc =
      "Whirlwind $?s436707[and Thunder Clap cause][causes] your next $85739u single-target $lattack:attacks; to strike up to $85739s1 additional targets for $85739s2% damage.\r\n\r\nWhirlwind generates $190411s1 Rage, plus an additional $190411s2 per target hit. Maximum $<maxRage> Rage.";
    expectNoErrors(desc);
  });

  it("parses complex damage calculation from description variables", () => {
    // From spell_description_variables
    const varDef =
      "${$cond($gt($SP,$AP),$SP*2.52,$AP*2.52)*$pctD*(1+$@versadmg)}";
    expectNoErrors(varDef);
  });

  it("parses hunter mastery calculation", () => {
    const varDef =
      "${$ap*($s2/100)*($321538d/$321538t1)*$<bmMastery>*$<serrated>*(1+$@versadmg)*(1+($137015s1/100))}";
    expectNoErrors(varDef);
  });

  it("parses gender forms in descriptions", () => {
    const desc = "Increases $ghis:her; damage by $s1 and armor by $s2 for $d.";
    expectNoErrors(desc);
  });

  it("parses Icy Veins (complex nested expression)", () => {
    const desc =
      "For $d, you deal $s1% more spell damage$?a343208[ and your spells cost $s2% less mana][].";
    expectNoErrors(desc);
  });
});
