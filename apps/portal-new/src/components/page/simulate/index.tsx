import Link from "next/link";

export function SimulateContent() {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <article>
        <header>
          <strong>Quick Sim</strong>
        </header>
        <p>Run a quick simulation with default settings for your character.</p>
        <Link href="/simulate/quick" role="button">
          Start Quick Sim
        </Link>
      </article>

      <article>
        <header>
          <strong>Advanced Sim</strong>
        </header>
        <p>Configure detailed simulation parameters for in-depth analysis.</p>
        <Link href="/simulate/advanced" role="button" className="secondary">
          Configure Simulation
        </Link>
      </article>
    </div>
  );
}
