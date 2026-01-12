"use client";

import type { ReactNode } from "react";

import { useBoolean, useKeyPress } from "ahooks";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
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
  const [isOpen, { setFalse: close, setTrue: open }] = useBoolean(false);
  const classes = expandable({ variant });
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();

      return () => {
        document.body.style.overflow = "";
        triggerRef.current?.focus();
      };
    }
  }, [isOpen]);

  useKeyPress("Escape", handleClose, {
    target: () => (isOpen ? window : null),
  });

  useKeyPress(
    "Tab",
    (e) => {
      e.preventDefault();
      closeButtonRef.current?.focus();
    },
    { target: () => (isOpen ? window : null) },
  );

  const isInline = variant === "image";
  const RootElement = isInline ? "span" : "div";
  const ContentElement = isInline ? "span" : "div";

  return (
    <>
      <RootElement
        ref={triggerRef as React.RefObject<HTMLDivElement & HTMLSpanElement>}
        className={classes.root}
        onClick={open}
        title={title}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
      >
        <ContentElement className={classes.content}>{children}</ContentElement>
      </RootElement>

      {isOpen &&
        createPortal(
          <Center
            className={classes.modalBackdrop}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Expanded view"}
          >
            <button
              ref={closeButtonRef}
              className={classes.modalClose}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              aria-label="Close"
              type="button"
            >
              <X size={24} color="white" />
            </button>
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
