import { requireAuth } from "@/lib/auth/require-auth";
import { PageLayout } from "@/components/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText } from "lucide-react";

export default async function HistoryPage() {
  await requireAuth();
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
    {
      id: 4,
      spec: "Shadow Priest",
      dps: 2812,
      duration: "5:00",
      date: "2024-01-14 19:27",
      preset: "Best in Slot",
    },
  ];

  return (
    <PageLayout
      title="Simulation History"
      description="Browse your simulation history"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Profile", href: "/user/profile" },
        { label: "History" },
      ]}
    >
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
    </PageLayout>
  );
}
