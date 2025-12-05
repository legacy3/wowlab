import Link from "next/link";
import { PageLayout } from "@/components/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  BarChart3,
  BookOpen,
  Code2,
  PlayCircle,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <PageLayout
      title="Dashboard"
      description="Welcome to WoW Lab - Your WoW rotation simulation toolkit"
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Rotations
              </CardTitle>
              <Code2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Create your first rotation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Simulations Run
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Run your first sim
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Community Rotations
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">No data yet</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/simulate">
                <Button variant="outline" className="w-full justify-start">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Run Simulation
                </Button>
              </Link>
              <Link href="/rotations/editor">
                <Button variant="outline" className="w-full justify-start">
                  <Code2 className="mr-2 h-4 w-4" />
                  Create Rotation
                </Button>
              </Link>
              <Link href="/rotations">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Rotations
                </Button>
              </Link>
              <Link href="/rankings">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Rankings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Rotations</CardTitle>
              <CardDescription>
                Top community rotations this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  name: "Shadow Priest BiS",
                  author: "player1",
                  dps: "2,847",
                  spec: "Shadow",
                },
                {
                  name: "Mage AoE Farm",
                  author: "player2",
                  dps: "3,124",
                  spec: "Fire",
                },
                {
                  name: "Warlock Leveling",
                  author: "player3",
                  dps: "1,956",
                  spec: "Affliction",
                },
              ].map((rotation, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rotation.name}</p>
                    <p className="text-xs text-muted-foreground">
                      by @{rotation.author} • {rotation.spec}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Zap className="mr-1 h-3 w-3" />
                      {rotation.dps}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    New to WoW Lab? Here&apos;s how to begin
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-amber-500">
                  Guide
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                      1
                    </div>
                    <h4 className="text-sm font-medium">Create a Rotation</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use the editor to build your custom rotation logic
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                      2
                    </div>
                    <h4 className="text-sm font-medium">Run Simulation</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Test your rotation against different scenarios
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                      3
                    </div>
                    <h4 className="text-sm font-medium">Analyze Results</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Review charts and optimize your performance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
}
