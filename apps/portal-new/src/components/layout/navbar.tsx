"use client";

import { Menu, X } from "lucide-react";
import { Box, Flex } from "styled-system/jsx";

import { IconButton } from "@/components/ui";

import { AuthButton } from "./auth-button";
import { useSidebar } from "./sidebar-context";

export function Navbar() {
  const { isOpen, toggle } = useSidebar();

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="40"
      bg="bg.canvas"
      borderBottomWidth="1px"
      borderColor="border"
    >
      <Flex align="center" justify="space-between" h="14" px="4">
        <IconButton
          variant="plain"
          size="sm"
          display={{ base: "flex", lg: "none" }}
          onClick={toggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </IconButton>
        <Box display={{ base: "none", lg: "block" }} />
        <Flex align="center" gap="3">
          <AuthButton />
        </Flex>
      </Flex>
    </Box>
  );
}
