"use client";

import { LogOut, Server, Settings, User } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useRouter } from "next/navigation";
import { Flex } from "styled-system/jsx";

import { Avatar, Menu, Skeleton } from "@/components/ui";
import { href, routes } from "@/lib/routing";
import { useUser } from "@/lib/state";

export function UserMenu() {
  const { userMenu: content } = useIntlayer("layout");
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
            {user.avatar_url ? (
              <Avatar.Image src={user.avatar_url} alt={user.handle ?? "User"} />
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
                user.handle &&
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
              {content.account}
            </Menu.Item>
            <Menu.Item
              value="settings"
              onClick={() => router.push(href(routes.account.settings))}
            >
              <Settings size={16} />
              {content.settings}
            </Menu.Item>
            <Menu.Item
              value="nodes"
              onClick={() => router.push(href(routes.account.nodes.index))}
            >
              <Server size={16} />
              {content.nodes}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.Item value="logout" onClick={handleSignOut}>
            <LogOut size={16} />
            {content.signOut}
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
