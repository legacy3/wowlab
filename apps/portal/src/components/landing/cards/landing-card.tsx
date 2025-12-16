"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LandingCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  content: string;
}

export function LandingCard({
  href,
  icon: Icon,
  title,
  description,
  content,
}: LandingCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{content}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
