import type { ReactNode } from "react";

import { Stack, styled } from "styled-system/jsx";

import type { Route } from "@/lib/routing";

import { Heading, Text } from "@/components/ui";

import type { BreadcrumbItem } from "./page-breadcrumbs";

import { PageBreadcrumbs } from "./page-breadcrumbs";

export type { BreadcrumbItem };

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
  children?: ReactNode;
  route: Route;
}

export function PageHeader({ breadcrumbs, children, route }: PageHeaderProps) {
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
              {route.label}
            </Heading>
            <Text color="fg.muted" textStyle="sm">
              {route.description}
            </Text>
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
