"use client";

import { useState } from "react";
import { Book, Wand2, Code2, Database, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ApiReference } from "./api-reference";
import { SpellBrowser } from "./spell-browser";
import { Snippets } from "./snippets";
import { DataInspector } from "./data-inspector";

type TabId = "api" | "spells" | "snippets" | "data";

interface EditorSidebarProps {
  onInsert: (text: string) => void;
  className?: string;
}

export function EditorSidebar({ onInsert, className }: EditorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("spells");

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center py-2 border-l bg-muted/30",
          className,
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mb-2"
          onClick={() => setCollapsed(false)}
        >
          <PanelRightClose className="h-4 w-4 rotate-180" />
        </Button>
        <div className="flex flex-col gap-1">
          <Button
            variant={activeTab === "api" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setActiveTab("api");
              setCollapsed(false);
            }}
            title="API Reference"
          >
            <Book className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === "spells" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setActiveTab("spells");
              setCollapsed(false);
            }}
            title="Spells"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === "snippets" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setActiveTab("snippets");
              setCollapsed(false);
            }}
            title="Snippets"
          >
            <Code2 className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === "data" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setActiveTab("data");
              setCollapsed(false);
            }}
            title="Data Inspector"
          >
            <Database className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col border-l bg-muted/30 w-72", className)}>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between border-b px-2 py-1">
          <TabsList className="h-8 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="api"
              className="h-7 px-2 data-[state=active]:bg-background"
              title="API Reference"
            >
              <Book className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="spells"
              className="h-7 px-2 data-[state=active]:bg-background"
              title="Spells"
            >
              <Wand2 className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="snippets"
              className="h-7 px-2 data-[state=active]:bg-background"
              title="Snippets"
            >
              <Code2 className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="h-7 px-2 data-[state=active]:bg-background"
              title="Data Inspector"
            >
              <Database className="h-3.5 w-3.5" />
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed(true)}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            <TabsContent value="api" className="mt-0">
              <ApiReference onInsert={onInsert} />
            </TabsContent>
            <TabsContent value="spells" className="mt-0">
              <SpellBrowser onInsert={onInsert} />
            </TabsContent>
            <TabsContent value="snippets" className="mt-0">
              <Snippets onInsert={onInsert} />
            </TabsContent>
            <TabsContent value="data" className="mt-0">
              <DataInspector />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
