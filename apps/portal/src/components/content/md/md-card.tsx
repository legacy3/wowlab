import type { ReactNode } from "react";

import { Grid } from "styled-system/jsx";

import * as Card from "@/components/ui/card";

type MdCardGridProps = {
  children: ReactNode;
  columns?: 2 | 3;
};

type MdCardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

type MdFeatureCardProps = {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
};

export function MdCard({ children, description, title }: MdCardProps) {
  return (
    <Card.Root my="4">
      {(title || description) && (
        <Card.Header>
          {title && <Card.Title>{title}</Card.Title>}
          {description && <Card.Description>{description}</Card.Description>}
        </Card.Header>
      )}
      <Card.Body>{children}</Card.Body>
    </Card.Root>
  );
}

export function MdCardGrid({ children, columns = 2 }: MdCardGridProps) {
  return (
    <Grid columns={{ base: 1, md: columns }} gap="4" my="6">
      {children}
    </Grid>
  );
}

export function MdFeatureCard({ children, icon, title }: MdFeatureCardProps) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title display="flex" alignItems="center" gap="2">
          {icon}
          {title}
        </Card.Title>
      </Card.Header>
      <Card.Body color="fg.muted">{children}</Card.Body>
    </Card.Root>
  );
}
