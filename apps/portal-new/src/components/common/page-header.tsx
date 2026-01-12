import type { ReactNode } from "react";

import { Stack, styled } from "styled-system/jsx";

import { Heading, Text } from "@/components/ui";

import type { BreadcrumbItem } from "./page-breadcrumbs";

import { PageBreadcrumbs } from "./page-breadcrumbs";

export type { BreadcrumbItem };

interface PageHeaderProps {
  /** Breadcrumb items array, or a ReactNode (e.g., from a parallel route slot) */
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
  children?: ReactNode;
  description?: string;
  title: string;
}

export function PageHeader({
  breadcrumbs,
  children,
  description,
  title,
}: PageHeaderProps) {
  const breadcrumbContent =
    Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? (
      <PageBreadcrumbs items={breadcrumbs} />
    ) : !Array.isArray(breadcrumbs) && breadcrumbs ? (
      breadcrumbs
    ) : null;

  return (
    <styled.header>
      <Stack gap="3">
        {breadcrumbContent}
        <Stack
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ sm: "center" }}
          gap="4"
        >
          <Stack gap="1">
            <Heading as="h1" textStyle="2xl" fontWeight="bold">
              {title}
            </Heading>
            {description && (
              <Text color="fg.muted" textStyle="sm">
                {description}
              </Text>
            )}
          </Stack>
          {children && (
            <Stack direction="row" gap="2">
              {children}
            </Stack>
          )}
        </Stack>
      </Stack>
    </styled.header>
  );
}
