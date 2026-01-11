"use client";

import type { ReactNode } from "react";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Center } from "styled-system/jsx";
import { expandable } from "styled-system/recipes";

type ExpandableProps = {
  children: ReactNode;
  expandedContent?: ReactNode;
  title?: string;
  variant?: "diagram" | "image";
};

export function Expandable({
  children,
  expandedContent,
  title,
  variant = "image",
}: ExpandableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const classes = expandable({ variant });

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

  // Use span for image variant to avoid hydration errors (images are inside <p> tags in MDX)
  const isInline = variant === "image";
  const RootElement = isInline ? "span" : "div";
  const ContentElement = isInline ? "span" : "div";

  return (
    <>
      <RootElement
        className={classes.root}
        onClick={() => setIsOpen(true)}
        title={title}
      >
        <ContentElement className={classes.content}>{children}</ContentElement>
      </RootElement>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <Center
            className={classes.modalBackdrop}
            onClick={() => setIsOpen(false)}
          >
            <Box
              as="button"
              className={classes.modalClose}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              <X size={24} color="white" />
            </Box>
            <Box
              className={classes.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              {expandedContent ?? children}
            </Box>
          </Center>,
          document.body,
        )}
    </>
  );
}
