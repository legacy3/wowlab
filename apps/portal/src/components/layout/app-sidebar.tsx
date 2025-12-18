"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { navMain, navSecondary } from "@/lib/menu-config";
import { version } from "../../../package.json";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <Image
                  src="/logo.svg"
                  alt="WoW Lab"
                  width={32}
                  height={32}
                  className="size-8"
                />
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold">WoW Lab</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Toolkit v{version}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
