import { PageLayout } from "@/components/page";
import { getDocPageData } from "./doc-data";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string[] }>;
};

export default async function DocLayout({ children, params }: Props) {
  const { slug } = await params;
  const { meta } = await getDocPageData(slug);

  return (
    <PageLayout
      title={meta.title}
      description={meta.description ?? "Technical documentation"}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Docs", href: "/docs" },
        { label: meta.title },
      ]}
    >
      {children}
    </PageLayout>
  );
}
