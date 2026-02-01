"use client";

import { Wifi, WifiOff } from "lucide-react";
import * as motion from "motion/react-client";

import { Link, Tooltip } from "@/components/ui";
import { href, routes } from "@/lib/routing";
import { type LiveState, useLiveState } from "@/lib/state/live";

// prettier-ignore
const config: Record<
  LiveState,
  { color: string; icon: "on" | "off"; label: string; pulse?: boolean }
> = {
  connected: { color: "green.500", icon: "on", label: "Beacon connected" },
  connecting: { color: "yellow.500", icon: "on", label: "Connecting to Beacon...", pulse: true },
  disabled: { color: "fg.disabled", icon: "off", label: "Sign in to use Beacon" },
  disconnected: { color: "red.500", icon: "off", label: "Beacon disconnected" },
};

const pulseAnimation = {
  animate: { opacity: [0.4, 1, 0.4] },
  transition: { duration: 1.5, ease: "easeInOut" as const, repeat: Infinity },
};

export function OnlineIndicator() {
  const state = useLiveState();
  const { color, icon, label, pulse } = config[state];
  const Icon = icon === "on" ? Wifi : WifiOff;

  return (
    <Tooltip content={label}>
      <Link
        href={href(routes.dev.metrics)}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w="8"
        h="8"
        color={color}
        _hover={{ opacity: 0.8 }}
      >
        <motion.span
          style={{ display: "inline-flex" }}
          {...(pulse && pulseAnimation)}
        >
          <Icon size={16} />
        </motion.span>
      </Link>
    </Tooltip>
  );
}
