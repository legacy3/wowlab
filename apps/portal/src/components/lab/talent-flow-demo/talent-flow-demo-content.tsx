"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useTalentTree } from "@/hooks/use-talent-tree";
import { TalentFlowTree } from "@/components/talents-flow";
import { TalentD3Tree } from "@/components/talents-d3";
import { TalentKonvaTree } from "@/components/talents-konva";
import { TalentTree } from "@/components/talents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Popular specs for demo (these are real WoW spec IDs)
const DEMO_SPECS = [
  { id: 253, name: "Beast Mastery", className: "Hunter" },
  { id: 254, name: "Marksmanship", className: "Hunter" },
  { id: 255, name: "Survival", className: "Hunter" },
  { id: 62, name: "Arcane", className: "Mage" },
  { id: 63, name: "Fire", className: "Mage" },
  { id: 64, name: "Frost", className: "Mage" },
  { id: 65, name: "Holy", className: "Paladin" },
  { id: 66, name: "Protection", className: "Paladin" },
  { id: 70, name: "Retribution", className: "Paladin" },
  { id: 256, name: "Discipline", className: "Priest" },
  { id: 257, name: "Holy", className: "Priest" },
  { id: 258, name: "Shadow", className: "Priest" },
  { id: 259, name: "Assassination", className: "Rogue" },
  { id: 260, name: "Outlaw", className: "Rogue" },
  { id: 261, name: "Subtlety", className: "Rogue" },
  { id: 262, name: "Elemental", className: "Shaman" },
  { id: 263, name: "Enhancement", className: "Shaman" },
  { id: 264, name: "Restoration", className: "Shaman" },
  { id: 265, name: "Affliction", className: "Warlock" },
  { id: 266, name: "Demonology", className: "Warlock" },
  { id: 267, name: "Destruction", className: "Warlock" },
  { id: 71, name: "Arms", className: "Warrior" },
  { id: 72, name: "Fury", className: "Warrior" },
  { id: 73, name: "Protection", className: "Warrior" },
  { id: 102, name: "Balance", className: "Druid" },
  { id: 103, name: "Feral", className: "Druid" },
  { id: 104, name: "Guardian", className: "Druid" },
  { id: 105, name: "Restoration", className: "Druid" },
  { id: 250, name: "Blood", className: "Death Knight" },
  { id: 251, name: "Frost", className: "Death Knight" },
  { id: 252, name: "Unholy", className: "Death Knight" },
  { id: 268, name: "Brewmaster", className: "Monk" },
  { id: 270, name: "Mistweaver", className: "Monk" },
  { id: 269, name: "Windwalker", className: "Monk" },
  { id: 577, name: "Havoc", className: "Demon Hunter" },
  { id: 581, name: "Vengeance", className: "Demon Hunter" },
  { id: 1467, name: "Devastation", className: "Evoker" },
  { id: 1468, name: "Preservation", className: "Evoker" },
  { id: 1473, name: "Augmentation", className: "Evoker" },
];

// Group by class
const GROUPED_SPECS = DEMO_SPECS.reduce(
  (acc, spec) => {
    if (!acc[spec.className]) {
      acc[spec.className] = [];
    }
    acc[spec.className].push(spec);
    return acc;
  },
  {} as Record<string, typeof DEMO_SPECS>,
);

function TalentTreeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  );
}

function ComparisonView({ specId }: { specId: number }) {
  const { data: tree, isLoading, error } = useTalentTree(specId);

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Current Implementation (SVG/HTML)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TalentTreeSkeleton />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">React Flow Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <TalentTreeSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !tree) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            Failed to load talent tree for spec ID {specId}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="react-flow" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="react-flow">React Flow</TabsTrigger>
        <TabsTrigger value="konva">Konva</TabsTrigger>
        <TabsTrigger value="d3">D3.js</TabsTrigger>
        <TabsTrigger value="current">Current (SVG/HTML)</TabsTrigger>
        <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
      </TabsList>

      <TabsContent value="react-flow">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              React Flow Implementation
              <Badge variant="secondary">New</Badge>
              <a
                href="https://reactflow.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                reactflow.dev
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardTitle>
            <CardDescription>
              Using{" "}
              <a
                href="https://reactflow.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @xyflow/react
              </a>{" "}
              with custom nodes, edges, minimap, and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TalentFlowTree tree={tree} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="konva">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Konva Implementation
              <a
                href="https://konvajs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                konvajs.org
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardTitle>
            <CardDescription>
              Using{" "}
              <a
                href="https://konvajs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                react-konva
              </a>{" "}
              with Canvas rendering and draggable stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TalentKonvaTree tree={tree} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="d3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              D3.js Implementation
              <a
                href="https://d3js.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                d3js.org
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardTitle>
            <CardDescription>
              Using{" "}
              <a
                href="https://d3js.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                D3.js
              </a>{" "}
              with SVG rendering and d3-zoom for pan/zoom
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TalentD3Tree tree={tree} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="current">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Implementation</CardTitle>
            <CardDescription>
              Using SVG lines for edges and positioned HTML divs for nodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TalentTree tree={tree} width={800} height={600} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="side-by-side">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current (SVG/HTML)</CardTitle>
            </CardHeader>
            <CardContent>
              <TalentTree tree={tree} width={500} height={500} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                React Flow
                <Badge variant="secondary" className="text-[10px]">
                  New
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[580px]">
                <TalentFlowTree tree={tree} className="h-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function TalentFlowDemoContent() {
  const [selectedSpecId, setSelectedSpecId] = useState<number>(263); // Enhancement Shaman default

  return (
    <div className="space-y-6">
      {/* Spec Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Specialization</CardTitle>
          <CardDescription>
            Choose a spec to compare the current SVG/HTML implementation with
            React Flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(GROUPED_SPECS).map(([className, specs]) => (
              <div key={className} className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {className}
                </div>
                <div className="flex flex-wrap gap-2">
                  {specs.map((spec) => (
                    <Button
                      key={spec.id}
                      variant={
                        selectedSpecId === spec.id ? "default" : "outline"
                      }
                      size="sm"
                      className={cn(
                        "h-7 text-xs",
                        selectedSpecId === spec.id && "bg-primary",
                      )}
                      onClick={() => setSelectedSpecId(spec.id)}
                    >
                      {spec.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      <ComparisonView specId={selectedSpecId} />

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Feature</th>
                  <th className="text-left py-2 px-4">Current</th>
                  <th className="text-left py-2 px-4 text-primary">
                    React Flow
                  </th>
                  <th className="text-left py-2 px-4">Konva</th>
                  <th className="text-left py-2 px-4">D3.js</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    Rendering
                  </td>
                  <td className="py-2 px-4">SVG + HTML</td>
                  <td className="py-2 px-4">SVG (unified)</td>
                  <td className="py-2 px-4">Canvas</td>
                  <td className="py-2 px-4">Pure SVG</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    Pan/Zoom
                  </td>
                  <td className="py-2 px-4">Custom hook</td>
                  <td className="py-2 px-4">Built-in</td>
                  <td className="py-2 px-4">Stage drag</td>
                  <td className="py-2 px-4">d3-zoom</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    Minimap
                  </td>
                  <td className="py-2 px-4">None</td>
                  <td className="py-2 px-4">Built-in</td>
                  <td className="py-2 px-4">Manual</td>
                  <td className="py-2 px-4">Manual</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    Controls
                  </td>
                  <td className="py-2 px-4">Manual reset</td>
                  <td className="py-2 px-4">Zoom, fit view</td>
                  <td className="py-2 px-4">Manual</td>
                  <td className="py-2 px-4">Manual</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    Edge Routing
                  </td>
                  <td className="py-2 px-4">Straight lines</td>
                  <td className="py-2 px-4">Smooth step</td>
                  <td className="py-2 px-4">Straight lines</td>
                  <td className="py-2 px-4">Straight lines</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    Bundle Size
                  </td>
                  <td className="py-2 px-4">~15 kB</td>
                  <td className="py-2 px-4">~184 kB</td>
                  <td className="py-2 px-4">~150 kB</td>
                  <td className="py-2 px-4">~280 kB</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    React Integration
                  </td>
                  <td className="py-2 px-4">Native</td>
                  <td className="py-2 px-4">Native</td>
                  <td className="py-2 px-4">react-konva</td>
                  <td className="py-2 px-4">Imperative</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">
                    Best For
                  </td>
                  <td className="py-2 px-4">Simple trees</td>
                  <td className="py-2 px-4">Node-based UIs</td>
                  <td className="py-2 px-4">Animations</td>
                  <td className="py-2 px-4">Custom viz</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
