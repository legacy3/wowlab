import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ValidationCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation</CardTitle>
        <CardDescription>Rotation checks and warnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
          <Badge variant="outline" className="border-green-500 mt-0.5">
            OK
          </Badge>
          <div className="flex-1">
            <p className="text-sm font-medium">Syntax Valid</p>
            <p className="text-xs text-muted-foreground">No errors detected</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
          <Badge variant="outline" className="border-yellow-500 mt-0.5">
            WARN
          </Badge>
          <div className="flex-1">
            <p className="text-sm font-medium">Missing DoT Refresh</p>
            <p className="text-xs text-muted-foreground">
              Consider refreshing DoTs earlier (line 14)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
          <Badge variant="outline" className="border-blue-500 mt-0.5">
            INFO
          </Badge>
          <div className="flex-1">
            <p className="text-sm font-medium">Optimization Tip</p>
            <p className="text-xs text-muted-foreground">
              Pool resources before major cooldowns
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
