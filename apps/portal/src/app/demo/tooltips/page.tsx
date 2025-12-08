import { TooltipDemo } from "@/components/game/tooltip-demo";

export default function TooltipsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Game Tooltips Demo
        </h1>
        <p className="mb-8 text-muted-foreground">
          WoW-style item and spell tooltips with quality colors and detailed
          information
        </p>
        <TooltipDemo />
      </div>
    </main>
  );
}
