import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";

export function RotationScriptCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rotation Script</CardTitle>
            <CardDescription>
              Edit your custom rotation priority
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button size="sm">
              <Play className="mr-2 h-4 w-4" />
              Test
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
          <pre className="text-muted-foreground">
            {`// Shadow Priest Rotation Priority

// Pre-pull
if (time.before_combat) {
  cast(vampiric_touch);
}

// Combat loop
if (cooldown.shadowfiend.ready) {
  cast(shadowfiend);
}

if (buff.shadow_word_pain.remains < 3) {
  cast(shadow_word_pain);
}

if (buff.vampiric_touch.remains < 3) {
  cast(vampiric_touch);
}

if (cooldown.mind_blast.ready) {
  cast(mind_blast);
}

if (target.health.percent < 20) {
  cast(shadow_word_death);
}

// Filler
cast(mind_flay);`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
