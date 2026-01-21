"use client";

import { Cpu, Menu, X } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useMemo } from "react";
import { Box, Flex, styled } from "styled-system/jsx";

import { IconButton, InlineLoader, Tooltip } from "@/components/ui";
import {
  selectRunningJobsCount,
  useComputingDrawer,
  useJobs,
} from "@/lib/state";

import { AuthButton } from "./auth-button";
import { LocaleSwitcher } from "./locale-switcher";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const { navbar: content } = useIntlayer("layout");
  const { isOpen, toggle } = useSidebar();
  const { setOpen: openDrawer } = useComputingDrawer();
  const jobs = useJobs((s) => s.jobs);
  const runningCount = useMemo(() => selectRunningJobsCount(jobs), [jobs]);

  return (
    <Box as="header" position="sticky" top="0" zIndex="40" bg="bg.canvas">
      <Flex align="center" justify="space-between" h="14" px="4">
        <IconButton
          variant="plain"
          size="sm"
          display={{ base: "flex", lg: "none" }}
          onClick={toggle}
          aria-label={isOpen ? content.closeMenu : content.openMenu}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </IconButton>
        <Box display={{ base: "none", lg: "block" }} />
        <Flex align="center" gap="2">
          <Tooltip content={content.computing}>
            <IconButton
              variant="plain"
              size="sm"
              onClick={() => openDrawer(true)}
              aria-label={content.openComputingDrawer}
            >
              <styled.span pos="relative">
                {runningCount > 0 ? (
                  <>
                    <InlineLoader variant="processing" />
                    <styled.span
                      pos="absolute"
                      top="-1"
                      right="-1"
                      minW="4"
                      h="4"
                      px="1"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="colorPalette.solid"
                      color="colorPalette.solid.fg"
                      textStyle="2xs"
                      fontWeight="bold"
                      rounded="full"
                    >
                      {runningCount}
                    </styled.span>
                  </>
                ) : (
                  <Cpu size={18} />
                )}
              </styled.span>
            </IconButton>
          </Tooltip>
          <LocaleSwitcher />
          <ThemeToggle />
          <AuthButton />
        </Flex>
      </Flex>
    </Box>
  );
}
