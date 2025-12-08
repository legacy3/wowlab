"use client";

import * as React from "react";
import { useAtom, useAtomValue } from "jotai";
import { Cpu, Loader2 } from "lucide-react";

import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { AuthButton } from "./auth-button";
import { computingDrawerOpenAtom } from "./computing-drawer";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { activeJobsCountAtom } from "@/atoms/computing";

function ComputingTrigger() {
  const [, setOpen] = useAtom(computingDrawerOpenAtom);
  const activeCount = useAtomValue(activeJobsCountAtom);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => setOpen(true)}
    >
      {activeCount > 0 ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Cpu className="h-4 w-4" />
      )}
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {activeCount}
        </span>
      )}
    </Button>
  );
}

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
          <ComputingTrigger />
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
