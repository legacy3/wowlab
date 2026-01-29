"use client";

import { Wifi, WifiOff } from "lucide-react";
import * as motion from "motion/react-client";
import { styled } from "styled-system/jsx";

import { Tooltip } from "@/components/ui";
import { useLiveState } from "@/lib/state/live";

const MotionSpan = motion.span;

export function OnlineIndicator() {
  const state = useLiveState();

  if (state === "connecting") {
    return (
      <Tooltip content="Connecting...">
        <styled.span
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="8"
          h="8"
          cursor="default"
        >
          <MotionSpan
            style={{
              color: "var(--colors-yellow-500)",
              display: "inline-flex",
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          >
            <Wifi size={16} />
          </MotionSpan>
        </styled.span>
      </Tooltip>
    );
  }

  const isConnected = state === "connected";

  return (
    <Tooltip content={isConnected ? "Connected" : "Disconnected"}>
      <styled.span
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w="8"
        h="8"
        color={isConnected ? "green.500" : "red.500"}
        cursor="default"
      >
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
      </styled.span>
    </Tooltip>
  );
}
