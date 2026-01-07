"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Panel } from "@xyflow/react";
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  ChevronDown,
  Loader2,
  Wand2,
  LayoutGrid,
  Trash2,
  Copy,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

// =============================================================================
// Quick Actions
// =============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "explain",
    label: "Explain rotation",
    icon: HelpCircle,
    prompt: "Explain how this rotation works step by step",
  },
  {
    id: "optimize",
    label: "Optimize",
    icon: Sparkles,
    prompt: "Suggest optimizations for this rotation",
  },
  {
    id: "layout",
    label: "Auto layout",
    icon: LayoutGrid,
    prompt: "Auto-arrange the nodes for better readability",
  },
  {
    id: "cleanup",
    label: "Clean up",
    icon: Trash2,
    prompt: "Remove unused nodes and simplify the flow",
  },
];

// =============================================================================
// Chat Panel Component
// =============================================================================

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onAutoLayout?: () => void;
  className?: string;
}

export const ChatPanel = memo(function ChatPanel({
  isOpen,
  onToggle,
  onAutoLayout,
  className,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you with your rotation. Ask me to explain the flow, suggest optimizations, or auto-arrange your nodes.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Check for auto-layout command
    if (
      text.toLowerCase().includes("layout") ||
      text.toLowerCase().includes("arrange")
    ) {
      setTimeout(() => {
        onAutoLayout?.();
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "Done! I've rearranged the nodes using a hierarchical layout. The flow should be easier to follow now.",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const responses = [
        "I've analyzed your rotation. The priority flow looks good, but you might want to add a condition to check for Bestial Wrath before using Kill Command for maximum damage.",
        "This Beast Mastery rotation follows the SimC APL pattern. The key priorities are: maintain Frenzy stacks with Barbed Shot, use Kill Command on cooldown, and fill with Cobra Shot.",
        "I can see you have both ST and Cleave branches. Consider adding a condition for Call of the Wild cooldown to optimize your burst windows.",
        "The flow structure is clear. One suggestion: you might want to add an execute phase check earlier in the priority to ensure Kill Shot is used optimally below 20% HP.",
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <Panel position="bottom-right" className="!m-2 !mb-14">
        <Button
          onClick={onToggle}
          size="sm"
          className="h-9 gap-2 shadow-lg bg-primary hover:bg-primary/90"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium">AI Assistant</span>
        </Button>
      </Panel>
    );
  }

  return (
    <Panel
      position="bottom-right"
      className={cn(
        "!m-2 !mb-14 bg-card/95 backdrop-blur-sm border rounded-xl shadow-2xl overflow-hidden transition-all duration-200",
        "w-80",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <div className="text-[11px] font-semibold">AI Assistant</div>
            <div className="text-[9px] text-muted-foreground">
              Ask about your rotation
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggle}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1 px-2 py-1.5 border-b overflow-x-auto">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[9px] gap-1 shrink-0"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              <Icon className="w-2.5 h-2.5" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Messages */}
      <ScrollArea className="h-48" ref={scrollRef}>
        <div className="p-2 space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-1.5 p-2 border-t">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your rotation..."
          className="h-7 text-[10px]"
          disabled={isLoading}
        />
        <Button
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </Panel>
  );
});
