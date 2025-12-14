import * as React from "react";

import type { BreadcrumbItemType } from "./page-header";
import { PageHeader } from "./page-header";

export interface PageLayoutProps {
  title: string;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItemType[];
  children: React.ReactNode;
}

export function PageLayout({
  title,
  description,
  breadcrumbs,
  children,
}: PageLayoutProps) {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      {children}
    </div>
  );
}
