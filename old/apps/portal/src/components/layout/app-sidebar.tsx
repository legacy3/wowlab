"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { navMain, navSecondary, navSocial } from "@/lib/menu-config";
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
      <SidebarFooter>
        <div className="flex items-center justify-center gap-1">
          {navSocial.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title={item.label}
              >
                <Icon className="size-4" />
              </a>
            );
          })}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
