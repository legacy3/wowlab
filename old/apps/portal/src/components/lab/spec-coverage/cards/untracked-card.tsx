"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tree, type TreeNode } from "@/components/ui/tree";
import {
  useSpecCoverage,
  type UntrackedSpell,
} from "@/hooks/use-spec-coverage";
import { WowSpellLink } from "@/components/game";
import { GithubSearchLink } from "@/components/shared/github-search-link";

function spellsToTreeNodes(spells: UntrackedSpell[]): TreeNode[] {
  const classMap = new Map<string, Map<string, UntrackedSpell[]>>();

  for (const spell of spells) {
    if (!classMap.has(spell.className)) {
      classMap.set(spell.className, new Map());
    }

    const specMap = classMap.get(spell.className)!;
    if (!specMap.has(spell.specName)) {
      specMap.set(spell.specName, []);
    }

    specMap.get(spell.specName)!.push(spell);
  }

  return Array.from(classMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([className, specMap]) => {
      const specs = Array.from(specMap.entries()).sort(([a], [b]) =>
        a.localeCompare(b),
      );
      const totalSpells = specs.reduce((sum, [, s]) => sum + s.length, 0);

      return {
        id: className,
        label: <span className="font-semibold text-sm">{className}</span>,
        badge: (
          <Badge variant="outline" className="text-xs">
            {totalSpells} spell{totalSpells !== 1 ? "s" : ""}
          </Badge>
        ),
        children: specs.map(([specName, specSpells]) => ({
          id: `${className}:${specName}`,
          label: <span className="font-medium text-sm">{specName}</span>,
          badge: (
            <Badge variant="secondary" className="text-xs">
              {specSpells.length}
            </Badge>
          ),
          children: [...specSpells]
            .sort((a, b) => a.spellId - b.spellId)
            .map((spell) => ({
              id: spell.handlerId,
              label: <WowSpellLink spellId={spell.spellId} />,
              _spell: spell,
            })) as (TreeNode & { _spell: UntrackedSpell })[],
        })),
      };
    });
}

function SpellLeaf({ node }: { node: TreeNode }) {
  const spell = (node as TreeNode & { _spell: UntrackedSpell })._spell;

  return (
    <div className="flex items-center justify-between gap-2 text-sm py-1">
      <div className="flex items-center gap-2 min-w-0">
        <WowSpellLink spellId={spell.spellId} />
      </div>
      <GithubSearchLink
        query={`"${spell.handlerId}"`}
        label={spell.handlerId}
      />
    </div>
  );
}

export function UntrackedCard() {
  const { data, loading, error, untrackedSpells } = useSpecCoverage();

  const nodes = useMemo(
    () => spellsToTreeNodes(untrackedSpells),
    [untrackedSpells],
  );

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            Untracked Spells
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Handler implementations without matching DBC spell data.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <FlaskInlineLoader className="h-6 w-6 text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            Untracked Spells
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Untracked Spells
          </CardTitle>
          <Badge
            variant={untrackedSpells.length > 0 ? "destructive" : "secondary"}
            className="font-mono"
          >
            {untrackedSpells.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Handler implementations with spell IDs not found in the DBC spell
          tables. These may be internal spell IDs, buff triggers, or outdated
          references.
        </p>
      </CardHeader>
      <CardContent>
        {untrackedSpells.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            All handler spell IDs have matching DBC data.
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Tree
              nodes={nodes}
              renderLeaf={(node) => <SpellLeaf node={node} />}
            />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
