import type { ReactNode } from "react";

import { Container, Stack } from "styled-system/jsx";

import type { BreadcrumbItem } from "./page-breadcrumbs";

import { PageBreadcrumbs } from "./page-breadcrumbs";
import { PageHeader } from "./page-header";

type MaxWidth = "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl";

interface PageContainerProps {
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
  children: ReactNode;
  description?: string;
  headerActions?: ReactNode;
  maxW?: MaxWidth;
  py?: "4" | "6" | "8" | "10" | "12";
  title?: string;
}

/**
 * Standard page container for consistent layout across the app.
 *
 * Uses Panda's Container pattern which provides:
 * - Centered content with mx="auto"
 * - Responsive horizontal padding (base: 4, md: 6, lg: 8)
 * - Configurable max-width
 *
 * Layout guidance:
 * - maxW="3xl" - Narrow content pages (blog index, docs index)
 * - maxW="5xl" - Article pages with sidebar (blog posts, doc articles)
 * - maxW="7xl" - Default for most pages
 * - maxW="8xl" - Wide dashboard pages
 *
 * @example
 * // Simple page with title
 * <PageContainer title="Computing" description="Worker status">
 *   <ComputingContent />
 * </PageContainer>
 *
 * @example
 * // Custom max-width for narrow content
 * <PageContainer maxW="3xl" py="12">
 *   <BlogList />
 * </PageContainer>
 *
 * @example
 * // Without header (content manages its own header)
 * <PageContainer maxW="5xl">
 *   <ArticleContent />
 * </PageContainer>
 */
export function PageContainer({
  breadcrumbs,
  children,
  description,
  headerActions,
  maxW = "7xl",
  py = "8",
  title,
}: PageContainerProps) {
  const breadcrumbContent = Array.isArray(breadcrumbs) ? (
    <PageBreadcrumbs items={breadcrumbs} />
  ) : (
    breadcrumbs
  );

  const hasHeader = title || breadcrumbContent;

  return (
    <Container maxW={maxW} py={py}>
      {hasHeader ? (
        <Stack gap="6">
          {title ? (
            <PageHeader
              title={title}
              description={description}
              breadcrumbs={breadcrumbs}
            >
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
