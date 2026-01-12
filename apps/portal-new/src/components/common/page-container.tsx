import type { ReactNode } from "react";

import { Container, Stack } from "styled-system/jsx";

import type { Route } from "@/lib/routing";

import type { BreadcrumbItem } from "./page-breadcrumbs";

import { PageBreadcrumbs } from "./page-breadcrumbs";
import { PageHeader } from "./page-header";

type MaxWidth = "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl";

interface PageContainerProps {
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
  children: ReactNode;
  headerActions?: ReactNode;
  maxW?: MaxWidth;
  py?: "4" | "6" | "8" | "10" | "12";
  route?: Route;
}

export function PageContainer({
  breadcrumbs,
  children,
  headerActions,
  maxW = "7xl",
  py = "8",
  route,
}: PageContainerProps) {
  const breadcrumbContent = Array.isArray(breadcrumbs) ? (
    <PageBreadcrumbs items={breadcrumbs} />
  ) : (
    breadcrumbs
  );

  const hasHeader = route || breadcrumbContent;

  return (
    <Container maxW={maxW} py={py}>
      {hasHeader ? (
        <Stack gap="6">
          {route ? (
            <PageHeader route={route} breadcrumbs={breadcrumbs}>
              {headerActions}
            </PageHeader>
          ) : (
            breadcrumbContent
          )}
          {children}
        </Stack>
      ) : (
        children
      )}
    </Container>
  );
}
