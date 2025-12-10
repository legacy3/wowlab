import { PageLayout } from "@/components/page";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/env";

export default function AboutPage() {
  return (
    <PageLayout
      title="About"
      description="What is WoW Lab and how does it work"
      breadcrumbs={[{ label: "About", href: "/about" }]}
    >
      <div className="max-w-3xl space-y-8">
        <section className="space-y-4">
          <p className="text-lg text-muted-foreground">
            WoW Lab is a free, open-source WoW simulation tool. It lets you test
            rotations, compare gear, and theorycraft without waiting in queues.
          </p>
          <p className="text-muted-foreground">
            The entire simulation runs in your browser. Your computer does the
            math, which means results are instant and you can run as many sims
            as you want without hitting rate limits or waiting for server
            capacity.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">How it works</h2>
          <p className="text-muted-foreground">
            When you hit simulate, the engine runs locally in your browser. It
            processes combat events the same way the game does: applying spells,
            tracking buffs, calculating damage over time.
          </p>
          <p className="text-muted-foreground">
            All the spell data, item stats, and game mechanics are stored in a
            database. Your browser maintains its own local cache with only the
            data it needs, so lookups are fast and you&apos;re not constantly
            fetching from the server.
          </p>
          <p className="text-muted-foreground">
            Rotations are written in JavaScript and can be edited directly on
            the site. The goal is to make developing and sharing rotations as
            accessible as possible.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Open source</h2>
          <p className="text-muted-foreground">
            The entire codebase is on{" "}
            <Link href={env.GITHUB_REPO_URL} external>
              GitHub
            </Link>
            . You can see exactly how calculations work, report bugs, or
            contribute if you want to. WoW Lab is free and will stay free. Since
            simulations run on your machine instead of a server, hosting costs
            stay minimal. At some point I might accept donations to cover
            what&apos;s left, but that&apos;s it.
          </p>
          <p className="text-muted-foreground">
            I&apos;ve been part of this community for about 15 years now. This
            is my way of giving back. If you want to contribute, check out the{" "}
            <Link href="/docs">docs</Link>.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Credits</h2>
          <p className="text-muted-foreground">
            All spell, item, and game data comes from{" "}
            <Link href="https://wago.tools" external>
              wago.tools
            </Link>
            . The entire simulation engine is built with{" "}
            <Link href="https://effect.website" external>
              Effect
            </Link>
            . Projects like this wouldn&apos;t be possible without them.
          </p>
          <p className="text-sm text-muted-foreground">
            Thanks to everyone in the WoW theorycrafting community who shares
            knowledge and helps make tools like this better.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
