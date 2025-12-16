import { LandingContent } from "@/components/landing";

export default function Home() {
  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">WoW Lab</h1>
        <p className="text-muted-foreground">
          Rotation simulation and theorycrafting tools
        </p>
      </header>

      <LandingContent />
    </main>
  );
}
