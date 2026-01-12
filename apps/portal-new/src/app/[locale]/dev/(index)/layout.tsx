import { PageContainer } from "@/components/common";
import { href, routes } from "@/lib/routing";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer
      title="Developer Tools"
      description="Internal tools and component showcases"
      breadcrumbs={[
        { href: href(routes.home), label: "Home" },
        { label: "Dev" },
      ]}
    >
      {children}
    </PageContainer>
  );
}
