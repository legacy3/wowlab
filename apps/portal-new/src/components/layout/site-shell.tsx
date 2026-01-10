"use client";

import type { ReactNode } from "react";

import { Box, Flex } from "styled-system/jsx";

import { AppSidebar } from "./app-sidebar";
import { Navbar } from "./navbar";
import { SidebarProvider } from "./sidebar-context";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <SidebarProvider>
      <Flex minH="100vh" bg="bg.canvas">
        <AppSidebar />
        <Box flex="1" ml={{ base: "0", lg: "64" }}>
          <Navbar />
          <Box as="main" p="4">
            {children}
          </Box>
        </Box>
      </Flex>
    </SidebarProvider>
  );
}
