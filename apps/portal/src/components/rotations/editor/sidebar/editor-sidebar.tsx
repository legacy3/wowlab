"use client";

import { useState } from "react";
import { PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SIDEBAR_TABS, DEFAULT_TAB, type TabId } from "./sidebar-tabs";
import {
  ApiReference,
  SpellBrowser,
  Snippets,
  DataInspector,
  VersionHistory,
} from "./tabs";

interface EditorSidebarProps {
  onInsert: (text: string) => void;
  rotationId?: string;
  currentVersion?: number;
  currentScript?: string;
  onRestore?: (script: string) => void;
  className?: string;
}

export function EditorSidebar({
  onInsert,
  rotationId,
  currentVersion,
  currentScript,
  onRestore,
  className,
}: EditorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB);

  if (collapsed) {
    return (
      <CollapsedSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCollapsed(false);
        }}
        onExpand={() => setCollapsed(false)}
        className={className}
      />
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
            {SIDEBAR_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-7 px-2 data-[state=active]:bg-background"
                title={tab.label}
              >
                <tab.icon className="h-3.5 w-3.5" />
              </TabsTrigger>
            ))}
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
            <TabsContent value="history" className="mt-0">
              <VersionHistory
                rotationId={rotationId}
                currentVersion={currentVersion}
                currentScript={currentScript ?? ""}
                onRestore={onRestore ?? (() => {})}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

interface CollapsedSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onExpand: () => void;
  className?: string;
}

function CollapsedSidebar({
  activeTab,
  onTabChange,
  onExpand,
  className,
}: CollapsedSidebarProps) {
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
        onClick={onExpand}
      >
        <PanelRightClose className="h-4 w-4 rotate-180" />
      </Button>
      <div className="flex flex-col gap-1">
        {SIDEBAR_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            <tab.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}
