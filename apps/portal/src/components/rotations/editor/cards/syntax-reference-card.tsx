import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SyntaxReferenceCard() {
  const references = [
    { command: "cast(spell)", desc: "Cast a spell" },
    {
      command: "cooldown.spell.ready",
      desc: "Check if cooldown is available",
    },
    { command: "buff.name.remains", desc: "Time remaining on buff" },
    {
      command: "target.health.percent",
      desc: "Target health percentage",
    },
    { command: "mana.percent", desc: "Current mana percentage" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Syntax Reference</CardTitle>
        <CardDescription>Available commands and conditions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {references.map((ref, i) => (
          <div key={i} className="rounded-lg border p-3">
            <code className="text-sm font-mono text-primary">
              {ref.command}
            </code>
            <p className="mt-1 text-sm text-muted-foreground">{ref.desc}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
