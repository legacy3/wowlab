import type { ReactNode } from "react";

import { Container, Stack } from "styled-system/jsx";

import type { BreadcrumbItem } from "./page-header";

import { PageHeader } from "./page-header";

type MaxWidth = "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl";

interface PageContainerProps {
  /** Breadcrumb items array, or a ReactNode (e.g., from a parallel route slot) */
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
  /** Page content */
  children: ReactNode;
  /** Optional page description shown in header */
  description?: string;
  /** Header action buttons */
  headerActions?: ReactNode;
  /** Max width of the container. Defaults to "5xl" */
  maxW?: MaxWidth;
  /** Vertical padding. Defaults to "8" */
  py?: "4" | "6" | "8" | "10" | "12";
  /** Optional page title - renders a PageHeader when provided */
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
  return (
    <Container maxW={maxW} py={py}>
      {title ? (
        <Stack gap="6">
          <PageHeader
            title={title}
            description={description}
            breadcrumbs={breadcrumbs}
          >
            {headerActions}
          </PageHeader>
          {children}
        </Stack>
      ) : (
        children
      )}
    </Container>
  );
}
