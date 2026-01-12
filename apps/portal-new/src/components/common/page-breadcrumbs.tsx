import NextLink from "next/link";
import { Fragment } from "react";

import { Breadcrumb, Link, Text } from "@/components/ui";

export interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Standalone breadcrumbs component for use in parallel route slots.
 *
 * @example
 * // In a @breadcrumb/page.tsx parallel route
 * export default async function BlogBreadcrumb({ params }) {
 *   const { slug } = await params;
 *   const { entry } = await getBlogPageData(slug);
 *   return (
 *     <PageBreadcrumbs
 *       items={[
 *         { label: "Home", href: "/" },
 *         { label: "Blog", href: "/blog" },
 *         { label: entry.title },
 *       ]}
 *     />
 *   );
 * }
 */
export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item.label}>
              <Breadcrumb.Item>
                {item.href ? (
                  <Link asChild textStyle="sm">
                    <NextLink href={item.href}>{item.label}</NextLink>
                  </Link>
                ) : (
                  <Text textStyle="sm" color="fg.muted">
                    {item.label}
                  </Text>
                )}
              </Breadcrumb.Item>
              {!isLast && <Breadcrumb.Separator />}
            </Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
