"use client";

import { ChevronRight } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import Image from "next/image";
import { Box, Flex, Stack, styled } from "styled-system/jsx";

import { Badge, Collapsible, Link, Text, Tooltip } from "@/components/ui";
import {
  href,
  type MenuItem,
  type MenuNavItem,
  navMain,
  navSecondary,
  routes,
} from "@/lib/routing";

import { RouteIcon } from "./route-icon";
import { useSidebar } from "./sidebar-context";

export function AppSidebar() {
  const { appSidebar: content } = useIntlayer("layout");
  const { isOpen } = useSidebar();

  return (
    <Box
      as="aside"
      position="fixed"
      left="0"
      top="0"
      h="100vh"
      w="64"
      bg="bg.canvas"
      borderRightWidth="1px"
      borderColor="border"
      display={{ base: isOpen ? "flex" : "none", lg: "flex" }}
      flexDirection="column"
      zIndex="50"
    >
      <Flex
        align="center"
        gap="3"
        px="4"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Link href={href(routes.home)} variant="plain">
          <Flex align="center" gap="3">
            <Image src="/logo.svg" alt="WoW Lab" width={32} height={32} />
            <Stack gap="0">
              <Text fontWeight="bold">WoW Lab</Text>
              <Text fontSize="xs" color="fg.muted">
                {content.toolkit}
              </Text>
            </Stack>
          </Flex>
        </Link>
      </Flex>

      <Stack gap="6" flex="1" overflow="auto" px="3" py="4">
        <Stack gap="1">
          {navMain.map((item) => (
            <NavGroup key={href(item.route)} item={item} />
          ))}
        </Stack>

        <Stack gap="1">
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.subtle"
            px="3"
            mb="1"
          >
            {content.misc}
          </Text>
          {navSecondary.map((item) => (
            <NavLink key={href(item.route)} item={item} />
          ))}
        </Stack>
      </Stack>

      <Flex
        px="4"
        py="3"
        borderTopWidth="1px"
        borderColor="border"
        justify="center"
        gap="2"
      >
        <Text fontSize="xs" color="fg.subtle">
          © 2025 WoW Lab
        </Text>
      </Flex>
    </Box>
  );
}

const SidebarLink = styled(Link, {
  base: {
    _hover: {
      bg: "gray.3",
      color: "fg.default",
    },
    alignItems: "center",
    color: "fg.muted",
    cursor: "pointer",
    display: "flex",
    fontSize: "sm",
    fontWeight: "medium",
    gap: "3",
    px: "3",
    py: "2",
    rounded: "l2",
    textDecoration: "none",
    transition: "colors",
  },
  variants: {
    active: {
      true: {
        bg: "gray.3",
        color: "fg.default",
      },
    },
  },
});

function NavGroup({ item }: { item: MenuNavItem }) {
  const { appSidebar: content } = useIntlayer("layout");
  const { pathWithoutLocale } = useLocale();
  const routePath = href(item.route);
  const isActive =
    pathWithoutLocale === routePath ||
    pathWithoutLocale.startsWith(routePath + "/");

  if (item.items.length === 0) {
    return (
      <Tooltip
        content={item.route.description}
        positioning={{ placement: "right" }}
      >
        <SidebarLink href={routePath} active={isActive} variant="plain">
          <RouteIcon name={item.route.icon} size={18} />
          {item.route.label}
        </SidebarLink>
      </Tooltip>
    );
  }

  return (
    <Collapsible.Root defaultOpen={isActive}>
      <Collapsible.Trigger asChild>
        <Flex
          align="center"
          justify="space-between"
          px="3"
          py="2"
          rounded="l2"
          cursor="pointer"
          color={isActive ? "fg.default" : "fg.muted"}
          bg={isActive ? "gray.3" : undefined}
          _hover={{ bg: "gray.3", color: "fg.default" }}
          transition="colors"
        >
          <Flex align="center" gap="3">
            <RouteIcon name={item.route.icon} size={18} />
            <Text fontSize="sm" fontWeight="medium">
              {item.route.label}
            </Text>
          </Flex>
          <Collapsible.Indicator>
            <ChevronRight size={16} />
          </Collapsible.Indicator>
        </Flex>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Stack gap="0.5" pl="9" mt="1">
          {item.items.map((subItem) => {
            const subPath = href(subItem);

            return (
              <Tooltip
                key={subPath}
                content={subItem.description}
                positioning={{ placement: "right" }}
              >
                <SidebarLink
                  href={subPath}
                  active={pathWithoutLocale === subPath}
                  variant="plain"
                  opacity={subItem.preview ? 0.5 : 1}
                >
                  <RouteIcon name={subItem.icon} size={16} />
                  {subItem.label}
                  {subItem.preview && (
                    <Badge size="sm" variant="outline" colorPalette="amber">
                      {content.preview}
                    </Badge>
                  )}
                </SidebarLink>
              </Tooltip>
            );
          })}
        </Stack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function NavLink({ item }: { item: MenuItem }) {
  const { pathWithoutLocale } = useLocale();
  const routePath = href(item.route);

  return (
    <Tooltip
      content={item.route.description}
      positioning={{ placement: "right" }}
    >
      <SidebarLink
        href={routePath}
        active={
          pathWithoutLocale === routePath ||
          pathWithoutLocale.startsWith(routePath + "/")
        }
        variant="plain"
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
      >
        <RouteIcon name={item.route.icon} size={18} />
        {item.route.label}
      </SidebarLink>
    </Tooltip>
  );
}
