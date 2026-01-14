import { type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

interface ChartCardProps {
  title: string;
  description: string;
  chartConfig: ChartConfig;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  chartConfig,
  children,
  footer,
  className,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          {children}
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col items-start gap-1.5 pt-4 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
