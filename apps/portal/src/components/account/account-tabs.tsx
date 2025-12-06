"use client";

import Link from "next/link";
import { Plus, FileCode, Clock, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UrlTabs } from "@/components/ui/url-tabs";
import { ProfileHeader } from "@/components/rotations/profile-header";
import { RotationsList } from "@/components/rotations/rotations-list";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["user_profiles"]["Row"];
type Rotation = Database["public"]["Tables"]["rotations"]["Row"];

type Props = {
  profile: Profile;
  rotations: Rotation[];
};

// Mock history data - would come from server in real implementation
const mockHistory = [
  {
    id: 1,
    spec: "Shadow Priest",
    dps: 2847,
    duration: "5:00",
    date: "2024-01-15 14:32",
    preset: "Best in Slot",
  },
  {
    id: 2,
    spec: "Shadow Priest",
    dps: 2691,
    duration: "5:00",
    date: "2024-01-15 13:18",
    preset: "Budget BiS",
  },
  {
    id: 3,
    spec: "Shadow Priest",
    dps: 2534,
    duration: "5:00",
    date: "2024-01-14 22:45",
    preset: "Fresh 60",
  },
];

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

function CharactersTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Characters</h2>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-lg font-semibold mb-2">No characters saved</p>
          <p className="text-sm text-muted-foreground mb-6">
            Import a character from the simulation page to save it here
          </p>
          <Link href="/simulate">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Import Character
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Simulation History</h2>
      <Card>
        <CardHeader>
          <CardTitle>Recent Simulations</CardTitle>
          <CardDescription>
            View and compare your past simulation runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockHistory.map((sim) => (
              <div
                key={sim.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{sim.spec}</span>
                    <Badge variant="secondary">{sim.preset}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {sim.date}
                    </span>
                    <span>Duration: {sim.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{sim.dps}</p>
                    <p className="text-xs text-muted-foreground">DPS</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccountTabs({ profile, rotations }: Props) {
  return (
    <div className="space-y-6">
      <ProfileHeader profile={profile} rotationCount={rotations.length} />

      <UrlTabs
        defaultTab="rotations"
        tabs={[
          {
            value: "rotations",
            label: "Rotations",
            content: <RotationsTab rotations={rotations} />,
          },
          {
            value: "characters",
            label: "Characters",
            content: <CharactersTab />,
          },
          {
            value: "history",
            label: "History",
            content: <HistoryTab />,
          },
        ]}
      />
    </div>
  );
}
