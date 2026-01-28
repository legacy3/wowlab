"use client";

import { css } from "styled-system/css";

import type { Profile } from "@/lib/sim";

import { GameIcon } from "@/components/game";
import { Badge, type BadgeProps } from "@/components/ui";
import { useClassesAndSpecs } from "@/lib/state";

const badgeStyles = css({
  _hover: { bg: "gray.4" },
  cursor: "pointer",
  gap: "2",
  transition: "background",
  transitionDuration: "fast",
});

export interface ProfileBadgeProps extends Omit<BadgeProps, "children"> {
  children?: React.ReactNode;
  profile: Profile;
}

export function ProfileBadge({
  children,
  profile,
  ...props
}: ProfileBadgeProps) {
  const { character } = profile;
  const { getClassColor, specs } = useClassesAndSpecs();

  const spec = character.spec
    ? specs.find((s) => s.name.toLowerCase() === character.spec?.toLowerCase())
    : null;

  const specIcon = spec?.file_name ?? null;
  const classColor = spec ? getClassColor(spec.id) : null;

  return (
    <Badge variant="outline" size="lg" className={badgeStyles} {...props}>
      <GameIcon iconName={specIcon} size="sm" />
      <span style={classColor ? { color: classColor } : undefined}>
        {character.name}
      </span>
      {children}
    </Badge>
  );
}
