import { Link } from "@/components/ui/link";
import { routes } from "@/lib/routes";

export function SimulateContent() {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <article>
        <header>
          <strong>Quick Sim</strong>
        </header>
        <p>Run a quick simulation with default settings for your character.</p>
        <Link href={routes.simulate.quick} role="button" muted>
          Start Quick Sim
        </Link>
      </article>

      <article>
        <header>
          <strong>Advanced Sim</strong>
        </header>
        <p>Configure detailed simulation parameters for in-depth analysis.</p>
        <Link
          href={routes.simulate.advanced}
          role="button"
          className="secondary"
          muted
        >
          Configure Simulation
        </Link>
      </article>
    </div>
  );
}
