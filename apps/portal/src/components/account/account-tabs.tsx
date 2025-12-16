"use client";

import Link from "next/link";
import { Plus, FileCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/components/rotations/profile-header";
import { RotationsList } from "@/components/rotations/rotations-list";
import type { UserIdentity, Rotation } from "@/lib/supabase/types";

type Props = {
  user: UserIdentity;
  rotations: Rotation[];
};

function RotationsTab({ rotations }: { rotations: Rotation[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          My Rotations {rotations.length > 0 && `(${rotations.length})`}
        </h2>
        <Link href="/rotations/editor">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Rotation
          </Button>
        </Link>
      </div>

      {rotations.length > 0 ? (
        <RotationsList rotations={rotations} groupByClass={false} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileCode className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold mb-2">No rotations yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first rotation to get started
            </p>
            <Link href="/rotations/editor">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Rotation
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AccountTabs({ user, rotations }: Props) {
  return (
    <div className="space-y-6">
      <ProfileHeader user={user} rotationCount={rotations.length} />
      <RotationsTab rotations={rotations} />
    </div>
  );
}
