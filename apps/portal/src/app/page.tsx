import Image from "next/image";
import { LandingContent } from "@/components/landing";

export default function Home() {
  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="WoW Lab logo"
            width={40}
            height={40}
            className="size-10"
          />
          <h1 className="text-2xl font-bold tracking-tight">WoW Lab</h1>
        </div>
        <p className="text-muted-foreground">
          Rotation simulation and theorycrafting tools
        </p>
      </header>

      <LandingContent />
    </main>
  );
}
