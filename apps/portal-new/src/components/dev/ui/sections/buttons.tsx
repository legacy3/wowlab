"use client";

import { MoreHorizontalIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { HStack } from "styled-system/jsx";

import { Button, IconButton } from "@/components/ui";

import { Section, Subsection } from "../shared";

export function ButtonsSection() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Section id="buttons" title="Buttons">
      <Subsection title="Variants">
        <HStack gap="3" flexWrap="wrap">
          <Button variant="solid">Solid</Button>
          <Button variant="surface">Surface</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="plain">Plain</Button>
        </HStack>
      </Subsection>

      <Subsection title="Sizes">
        <HStack gap="3" flexWrap="wrap" alignItems="center">
          {(["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const).map(
            (size) => (
              <Button key={size} size={size}>
                {size}
              </Button>
            ),
          )}
        </HStack>
      </Subsection>

      <Subsection title="Colors">
        <HStack gap="3" flexWrap="wrap">
          <Button colorPalette="amber">Amber</Button>
          <Button colorPalette="green">Green</Button>
          <Button colorPalette="red">Red</Button>
          <Button colorPalette="gray">Gray</Button>
        </HStack>
      </Subsection>

      <Subsection title="Loading">
        <HStack gap="3" flexWrap="wrap">
          <Button loading>Loading</Button>
          <Button loading loadingText="Saving...">
            Save
          </Button>
          <Button loading={loading} onClick={handleClick}>
            {loading ? "Processing..." : "Click me"}
          </Button>
        </HStack>
      </Subsection>

      <Subsection title="Icon Buttons">
        <HStack gap="3" flexWrap="wrap">
          <IconButton aria-label="Settings" variant="outline">
            <SettingsIcon />
          </IconButton>
          <IconButton aria-label="More" variant="subtle">
            <MoreHorizontalIcon />
          </IconButton>
          <IconButton aria-label="User" variant="plain">
            <UserIcon />
          </IconButton>
        </HStack>
      </Subsection>
    </Section>
  );
}
