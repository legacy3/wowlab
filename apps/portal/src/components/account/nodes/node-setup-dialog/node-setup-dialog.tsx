"use client";

import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { useIntlayer } from "next-intlayer";

import { Dialog } from "@/components/ui";

import { SetupContent } from "./setup-content";
import { SuccessContent } from "./success-content";
import { useNodeConnection } from "./use-node-connection";

const MotionDiv = motion.div;

interface NodeSetupDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function NodeSetupDialog({ onOpenChange, open }: NodeSetupDialogProps) {
  const content = useIntlayer("account").setupDialog;
  const nodeConnected = useNodeConnection(open);

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content w={{ base: "full", sm: "lg" }}>
          <Dialog.Header>
            <Dialog.Title>{content.title}</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <AnimatePresence mode="wait" initial={false}>
              {nodeConnected ? (
                <MotionDiv
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <SuccessContent onClose={handleClose} />
                </MotionDiv>
              ) : (
                <MotionDiv
                  key="setup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <SetupContent />
                </MotionDiv>
              )}
            </AnimatePresence>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
