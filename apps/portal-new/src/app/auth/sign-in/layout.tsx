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
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sign In" }]}
    >
      {children}
    </PageLayout>
  );
}
