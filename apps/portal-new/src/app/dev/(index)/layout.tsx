import { PageContainer } from "@/components/common";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer
      title="Developer Tools"
      description="Internal tools and component showcases"
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Dev" }]}
    >
      {children}
    </PageContainer>
  );
}
