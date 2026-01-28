import { PageContainer } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer
      route={routes.dev.index}
      breadcrumbs={breadcrumb(routes.home, routes.dev.index)}
    >
      {children}
    </PageContainer>
  );
}
