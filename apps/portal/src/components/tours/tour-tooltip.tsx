"use client";

import type { TooltipRenderProps } from "react-joyride";
import { X } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TourTooltip({
  backProps,
  closeProps,
  continuous,
  index,
  primaryProps,
  skipProps,
  step,
  size,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <Card
      {...tooltipProps}
      className="w-[340px] gap-0 py-0 shadow-lg border-primary/20"
    >
      <CardHeader className="relative pb-2 pt-4">
        {step.title && (
          <CardTitle className="text-base">{step.title}</CardTitle>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-2 top-2 h-7 w-7"
          {...closeProps}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="pb-4 pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step.content}
        </p>
      </CardContent>

      <CardFooter className="border-t bg-muted/30 px-4 py-3 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" {...skipProps}>
            Skip
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {index + 1} / {size}
          </span>

          {index > 0 && (
            <Button variant="outline" size="sm" {...backProps}>
              Back
            </Button>
          )}

          {continuous && (
            <Button size="sm" {...primaryProps}>
              {index === size - 1 ? "Done" : "Next"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
