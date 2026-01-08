import { PageLayout } from "@/components/layout";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout title="Home" description="Simulation and theorycrafting tools">
      {children}
    </PageLayout>
  );
}
