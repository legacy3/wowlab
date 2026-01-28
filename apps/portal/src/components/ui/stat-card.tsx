"use client";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { createStyleContext } from "styled-system/jsx";
import { statCard } from "styled-system/recipes";

import { Card } from "@/components/ui";

const { withContext, withProvider } = createStyleContext(statCard);

const StatCardRoot = withProvider(ark.div, "root");
const StatCardLabelGroup = withContext(ark.div, "labelGroup");
const StatCardIcon = withContext(ark.span, "icon");
const StatCardLabel = withContext(ark.span, "label");
const StatCardValue = withContext(ark.span, "value");

export interface StatCardProps extends ComponentProps<typeof StatCardRoot> {
  icon: LucideIcon;
  label: string;
  value: string | number | null;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  ...props
}: StatCardProps) {
  return (
    <Card.Root h="full">
      <Card.Body p="0">
        <StatCardRoot {...props}>
          <StatCardLabelGroup>
            <StatCardIcon asChild>
              <Icon />
            </StatCardIcon>
            <StatCardLabel>{label}</StatCardLabel>
          </StatCardLabelGroup>
          <StatCardValue>{value ?? "\u2014"}</StatCardValue>
        </StatCardRoot>
      </Card.Body>
    </Card.Root>
  );
}
