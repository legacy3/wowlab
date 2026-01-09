import { PageLayout } from "@/components/layout";

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Sign In"
      description="Sign in to your account"
      breadcrumbs={[{ href: "/", label: "Home" }, { label: "Sign In" }]}
    >
      {children}
    </PageLayout>
  );
}
