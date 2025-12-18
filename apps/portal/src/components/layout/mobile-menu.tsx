"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { navMain, navSecondary } from "@/lib/menu-config";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 px-0">
        <SheetHeader className="px-6 pb-4">
          <SheetTitle asChild>
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <Image
                src="/logo.svg"
                alt="WoW Lab"
                width={32}
                height={32}
                className="size-8"
              />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-bold">WoW Lab</span>
                <span className="text-xs text-muted-foreground">
                  Simulator Toolkit
                </span>
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="flex flex-col space-y-2 px-4 pb-4">
            {/* Main navigation with collapsible sections */}
            {navMain.map((group) => {
              const Icon = group.icon;
              const isGroupActive = pathname.startsWith(group.href);

              return (
                <Collapsible
                  key={group.label}
                  defaultOpen={isGroupActive}
                  className="group/collapsible"
                >
                  <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50">
                    <Icon className="size-4" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <nav className="ml-4 flex flex-col space-y-1 border-l pl-4 pt-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "rounded-lg px-3 py-2 text-sm transition-colors",
                              isActive
                                ? "bg-secondary text-secondary-foreground"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                            )}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {/* Separator */}
            <div className="my-2 border-t" />

            {/* Secondary navigation (flat) */}
            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resources
              </h4>
              <nav className="flex flex-col space-y-1">
                {navSecondary.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  if (item.external) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
