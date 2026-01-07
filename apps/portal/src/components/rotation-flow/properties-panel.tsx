"use client";

import { memo } from "react";
import {
  Zap,
  GitBranch,
  Variable,
  FolderOpen,
  Trash2,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MOCK_SPELLS, CONDITION_SUBJECTS } from "./constants";
import type { RotationNode } from "./types";

interface PropertiesPanelProps {
  selectedNode: RotationNode | null;
  onUpdateNode: (id: string, data: Partial<RotationNode["data"]>) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const PropertiesPanel = memo(function PropertiesPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onClose,
  collapsed = false,
  onToggleCollapse,
  className,
}: PropertiesPanelProps) {
  // Collapsed view
  if (collapsed) {
    return (
      <div className={cn("flex flex-col h-full bg-muted/20 w-10 transition-all duration-200", className)}>
        <div className="flex items-center justify-center p-1 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 p-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                <Settings2 className="w-3 h-3 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-[10px]">
              {selectedNode ? `Edit ${selectedNode.type}` : "No selection"}
            </TooltipContent>
          </Tooltip>

          {selectedNode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-accent"
                  onClick={onToggleCollapse}
                >
                  <NodeIcon type={selectedNode.type} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-[10px]">
                {selectedNode.data.label || selectedNode.type}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className={cn("flex flex-col h-full bg-muted/20 w-48 transition-all duration-200", className)}>
        <div className="flex items-center justify-between p-1 border-b">
          <span className="text-[10px] text-muted-foreground px-1">Properties</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleCollapse}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground p-3 text-center">
          Select a node to edit
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-muted/20 w-48 transition-all duration-200", className)}>
      <div className="flex items-center gap-1.5 px-2 py-1 border-b">
        <NodeIcon type={selectedNode.type} />
        <span className="flex-1 text-[10px] font-semibold capitalize">
          {selectedNode.type}
        </span>
        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onToggleCollapse}>
          <ChevronRight className="w-2.5 h-2.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onClose}>
          <X className="w-2.5 h-2.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {selectedNode.type === "spell" && (
            <SpellProperties
              node={selectedNode}
              onUpdate={(data) => onUpdateNode(selectedNode.id, data)}
            />
          )}
          {selectedNode.type === "condition" && (
            <ConditionProperties
              node={selectedNode}
              onUpdate={(data) => onUpdateNode(selectedNode.id, data)}
            />
          )}
          {selectedNode.type === "variable" && (
            <VariableProperties
              node={selectedNode}
              onUpdate={(data) => onUpdateNode(selectedNode.id, data)}
            />
          )}
          {selectedNode.type === "group" && (
            <GroupProperties
              node={selectedNode}
              onUpdate={(data) => onUpdateNode(selectedNode.id, data)}
            />
          )}
          {selectedNode.type === "comment" && (
            <CommentProperties
              node={selectedNode}
              onUpdate={(data) => onUpdateNode(selectedNode.id, data)}
            />
          )}
        </div>
      </ScrollArea>

      {selectedNode.type !== "start" && (
        <div className="flex items-center gap-0.5 p-1.5 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-5 text-[10px] gap-1"
            onClick={() => onDuplicateNode(selectedNode.id)}
          >
            <Copy className="w-2.5 h-2.5" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-5 text-[10px] gap-1 text-destructive hover:text-destructive"
            onClick={() => onDeleteNode(selectedNode.id)}
          >
            <Trash2 className="w-2.5 h-2.5" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
});

function NodeIcon({ type }: { type: string }) {
  const cls = "w-3 h-3";
  switch (type) {
    case "spell":
      return <Zap className={cn(cls, "text-orange-500")} />;
    case "condition":
      return <GitBranch className={cn(cls, "text-blue-500")} />;
    case "variable":
      return <Variable className={cn(cls, "text-green-500")} />;
    case "group":
      return <FolderOpen className={cn(cls, "text-purple-500")} />;
    default:
      return null;
  }
}

interface PropertyProps<T> {
  node: RotationNode & { data: T };
  onUpdate: (data: Partial<T>) => void;
}

function SpellProperties({ node, onUpdate }: PropertyProps<any>) {
  const { data } = node;

  return (
    <>
      <div className="space-y-1">
        <Label className="text-[10px]">Label</Label>
        <Input
          value={data.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="h-6 text-[10px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Spell</Label>
        <Select
          value={String(data.spellId)}
          onValueChange={(value) => {
            const spell = MOCK_SPELLS.find((s) => s.id === Number(value));
            if (spell) {
              onUpdate({ spellId: spell.id, spellName: spell.name, color: spell.color });
            }
          }}
        >
          <SelectTrigger className="h-6 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOCK_SPELLS.map((spell) => (
              <SelectItem key={spell.id} value={String(spell.id)} className="text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: spell.color }} />
                  {spell.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Target</Label>
        <Select value={data.target} onValueChange={(value) => onUpdate({ target: value })}>
          <SelectTrigger className="h-6 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_target" className="text-[10px]">Target</SelectItem>
            <SelectItem value="self" className="text-[10px]">Self</SelectItem>
            <SelectItem value="focus" className="text-[10px]">Focus</SelectItem>
            <SelectItem value="pet" className="text-[10px]">Pet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-1" />

      <div className="flex items-center justify-between">
        <Label className="text-[10px]">Enabled</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => onUpdate({ enabled: checked })}
          className="scale-75"
        />
      </div>
    </>
  );
}

function ConditionProperties({ node, onUpdate }: PropertyProps<any>) {
  const { data } = node;

  return (
    <>
      <div className="space-y-1">
        <Label className="text-[10px]">Label</Label>
        <Input
          value={data.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="h-6 text-[10px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Type</Label>
        <Select value={data.conditionType} onValueChange={(value) => onUpdate({ conditionType: value })}>
          <SelectTrigger className="h-6 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="if" className="text-[10px]">If</SelectItem>
            <SelectItem value="and" className="text-[10px]">AND</SelectItem>
            <SelectItem value="or" className="text-[10px]">OR</SelectItem>
            <SelectItem value="not" className="text-[10px]">NOT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.conditionType === "if" && (
        <>
          <div className="space-y-1">
            <Label className="text-[10px]">Subject</Label>
            <Select value={data.subject} onValueChange={(value) => onUpdate({ subject: value })}>
              <SelectTrigger className="h-6 text-[10px]">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-[10px]">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="space-y-1">
              <Label className="text-[10px]">Op</Label>
              <Select value={data.operator} onValueChange={(value) => onUpdate({ operator: value })}>
                <SelectTrigger className="h-6 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eq" className="text-[10px]">=</SelectItem>
                  <SelectItem value="neq" className="text-[10px]">!=</SelectItem>
                  <SelectItem value="gt" className="text-[10px]">&gt;</SelectItem>
                  <SelectItem value="gte" className="text-[10px]">&gt;=</SelectItem>
                  <SelectItem value="lt" className="text-[10px]">&lt;</SelectItem>
                  <SelectItem value="lte" className="text-[10px]">&lt;=</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Value</Label>
              <Input
                value={String(data.value ?? "")}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  onUpdate({ value: isNaN(num) ? e.target.value : num });
                }}
                className="h-6 text-[10px] font-mono"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function VariableProperties({ node, onUpdate }: PropertyProps<any>) {
  const { data } = node;

  return (
    <>
      <div className="space-y-1">
        <Label className="text-[10px]">Name</Label>
        <Input
          value={data.variableName || ""}
          onChange={(e) => onUpdate({ variableName: e.target.value })}
          className="h-6 text-[10px] font-mono"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Type</Label>
        <Select value={data.variableType} onValueChange={(value) => onUpdate({ variableType: value })}>
          <SelectTrigger className="h-6 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number" className="text-[10px]">Number</SelectItem>
            <SelectItem value="boolean" className="text-[10px]">Boolean</SelectItem>
            <SelectItem value="string" className="text-[10px]">String</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Expression</Label>
        <Input
          value={data.expression || ""}
          onChange={(e) => onUpdate({ expression: e.target.value })}
          className="h-6 text-[10px] font-mono"
        />
      </div>
    </>
  );
}

function GroupProperties({ node, onUpdate }: PropertyProps<any>) {
  const { data } = node;

  return (
    <>
      <div className="space-y-1">
        <Label className="text-[10px]">Name</Label>
        <Input
          value={data.groupName || ""}
          onChange={(e) => onUpdate({ groupName: e.target.value })}
          className="h-6 text-[10px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Description</Label>
        <Textarea
          value={data.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="text-[10px] min-h-[40px]"
        />
      </div>
    </>
  );
}

function CommentProperties({ node, onUpdate }: PropertyProps<any>) {
  const { data } = node;

  return (
    <div className="space-y-1">
      <Label className="text-[10px]">Note</Label>
      <Textarea
        value={data.text || ""}
        onChange={(e) => onUpdate({ text: e.target.value })}
        className="text-[10px] min-h-[60px]"
      />
    </div>
  );
}
