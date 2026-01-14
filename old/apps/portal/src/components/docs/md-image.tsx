"use client";

import { useState, useEffect } from "react";
import { Maximize2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type MdImageProps = {
  children: React.ReactNode;
  className?: string;
};

export function MdImage({ children, className }: MdImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen]);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={cn(
          "group my-6 relative cursor-pointer rounded-lg border border-border/50 bg-muted/30 p-6 transition-colors hover:border-border hover:bg-muted/50",
          className,
        )}
      >
        <div className="flex justify-center overflow-x-auto [&_svg]:min-w-[600px] [&_svg]:w-full [&_svg]:max-w-[900px]">
          {children}
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground">
            <Maximize2 className="h-3 w-3" />
            <span>Click to expand</span>
          </div>
        </div>
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-8"
            onClick={() => setIsOpen(false)}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <div
              className="w-full h-full flex items-center justify-center overflow-auto [&_svg]:w-[90vw] [&_svg]:h-auto [&_svg]:max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
