"use client";

import * as React from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FlaskInlineLoader } from "./flask-inline";
import type { VariantProps } from "class-variance-authority";

export interface FlaskButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

export function FlaskButton({
  children,
  loading = false,
  disabled,
  className,
  ...props
}: FlaskButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Button
      disabled={isDisabled}
      className={cn(
        "cursor-pointer disabled:cursor-wait disabled:pointer-events-auto disabled:opacity-70",
        className,
      )}
      {...props}
    >
      <FlaskInlineLoader animate={loading} className="shrink-0" />
      {children}
    </Button>
  );
}
