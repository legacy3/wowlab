import { PageLayout } from "@/components/page";
import { SignIn } from "@/components/auth/sign-in-content";

export default function SignInPage() {
  return (
    <PageLayout
      title="Sign In"
      description="Sign in to your account"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sign In" }]}
    >
      <div className="mx-auto max-w-md py-12">
        <SignIn />
      </div>
    </PageLayout>
  );
}
