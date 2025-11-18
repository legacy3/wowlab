import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Upload } from "lucide-react";

export function TemplatesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates</CardTitle>
        <CardDescription>Load preset rotations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <Code className="mr-2 h-4 w-4" />
          Shadow BiS
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Code className="mr-2 h-4 w-4" />
          Shadow Leveling
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Code className="mr-2 h-4 w-4" />
          Shadow AoE
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </CardContent>
    </Card>
  );
}
