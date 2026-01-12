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
 * import { href, routes } from "@/lib/routing";
 *
 * export default async function BlogBreadcrumb({ params }) {
 *   const { slug } = await params;
 *   const { entry } = await getBlogPageData(slug);
 *   return (
 *     <PageBreadcrumbs
 *       items={[
 *         { label: "Home", href: href(routes.home) },
 *         { label: "Blog", href: href(routes.blog.index) },
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
                  <Link href={item.href} textStyle="sm">
                    {item.label}
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
