import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";
import { ProfileHeader } from "@/components/rotations/profile-header";
import { RotationsList } from "@/components/rotations/rotations-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCode, Plus } from "lucide-react";

export default async function UserProfilePage() {
  const { profile, supabase } = await requireAuth();

  // Get current user's rotations
  const { data: rotations } = await supabase
    .from("rotations")
    .select("*")
    .eq("user_id", profile.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <PageLayout
      title="My Profile"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile" }]}
    >
      <div className="space-y-6">
        <ProfileHeader
          profile={profile}
          rotationCount={rotations?.length ?? 0}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              My Rotations {rotations?.length ? `(${rotations.length})` : ""}
            </h2>
            <Link href="/editor">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Rotation
              </Button>
            </Link>
          </div>

          {rotations && rotations.length > 0 ? (
            <RotationsList rotations={rotations} groupByClass={false} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileCode className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-semibold mb-2">No rotations yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first rotation to get started
                </p>
                <Link href="/editor">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Rotation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
