"use client";

import * as React from "react";

import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { AuthButton } from "./auth-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center gap-2 px-4">
        <MobileMenu />
        <SidebarTrigger className="-ml-1 hidden lg:flex" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 hidden lg:block"
        />
        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
