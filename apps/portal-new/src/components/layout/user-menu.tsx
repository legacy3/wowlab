"use client";

import { LogOut, Settings, User } from "lucide-react";
import { useExtracted } from "next-intl";
import { useRouter } from "next/navigation";
import { Flex } from "styled-system/jsx";

import { Avatar, Menu, Skeleton } from "@/components/ui";
import { href, routes } from "@/lib/routing";
import { useUser } from "@/lib/state";

export function UserMenu() {
  const t = useExtracted();
  const router = useRouter();
  const { data: user, isLoading, logout } = useUser();

  const handleSignOut = () => {
    logout();
    router.push(href(routes.auth.signIn));
    router.refresh();
  };

  if (isLoading) {
    return <Skeleton borderRadius="full" h="8" w="8" />;
  }

  if (!user) {
    return null;
  }

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Flex
          as="button"
          align="center"
          justify="center"
          rounded="full"
          cursor="pointer"
          bg="transparent"
          border="none"
          p="0"
        >
          <Avatar.Root size="sm">
            {user.avatarUrl ? (
              <Avatar.Image src={user.avatarUrl} alt={user.handle ?? "User"} />
            ) : null}
            <Avatar.Fallback>{user.initials}</Avatar.Fallback>
          </Avatar.Root>
        </Flex>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content minW="48">
          <Menu.ItemGroup>
            <Menu.Item
              value="profile"
              fontWeight="medium"
              onClick={() =>
                router.push(href(routes.users.profile, { handle: user.handle }))
              }
            >
              @{user.handle}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.Item
              value="account"
              onClick={() => router.push(href(routes.account.index))}
            >
              <User size={16} />
              {t("Account")}
            </Menu.Item>
            <Menu.Item
              value="settings"
              onClick={() => router.push(href(routes.account.settings))}
            >
              <Settings size={16} />
              {t("Settings")}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.Item value="logout" onClick={handleSignOut}>
            <LogOut size={16} />
            {t("Sign out")}
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
