import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";

export default async function CreateRotationPage() {
  await requireAuth();

  return (
    <PageLayout
      title="Create Rotation"
      description="Create a new rotation for your character"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Profile", href: "/user/profile" },
        { label: "Create Rotation" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <p className="text-muted-foreground">
          Rotation creation wizard will be implemented here.
        </p>
      </div>
    </PageLayout>
  );
}
