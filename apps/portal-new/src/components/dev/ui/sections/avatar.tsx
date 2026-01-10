import { HStack, VStack } from "styled-system/jsx";

import { Avatar, Text } from "@/components/ui";

import { Section, Subsection } from "../shared";

export function AvatarSection() {
  return (
    <Section id="avatar" title="Avatar">
      <Subsection title="Sizes">
        <HStack gap="4" alignItems="end">
          {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
            <VStack key={size} gap="2">
              <Avatar.Root size={size}>
                <Avatar.Fallback>JD</Avatar.Fallback>
              </Avatar.Root>
              <Text textStyle="xs" color="fg.muted">
                {size}
              </Text>
            </VStack>
          ))}
        </HStack>
      </Subsection>

      <Subsection title="With Image">
        <HStack gap="4">
          <Avatar.Root>
            <Avatar.Image src="https://i.pravatar.cc/150?u=1" alt="User" />
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Image src="https://i.pravatar.cc/150?u=2" alt="User" />
            <Avatar.Fallback>AB</Avatar.Fallback>
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback>CD</Avatar.Fallback>
          </Avatar.Root>
        </HStack>
      </Subsection>
    </Section>
  );
}
