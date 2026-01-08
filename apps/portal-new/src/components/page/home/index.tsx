import Link from "next/link";
import { routes } from "@/lib/routes";

export function HomeContent() {
  return (
    <>
      <div className="grid">
        <article>
          <h3>Simulate</h3>
          <p>
            Run DPS simulations with customizable parameters and rotation
            configurations.
          </p>
          <Link href={routes.simulate.index} role="button">
            Get Started
          </Link>
        </article>

        <article>
          <h3>Talents</h3>
          <p>
            Explore and compare talent builds across all classes and
            specializations.
          </p>
          <Link href={routes.talents} role="button" className="secondary">
            Browse Talents
          </Link>
        </article>

        <article>
          <h3>Rotations</h3>
          <p>
            Build and share rotation profiles for simulation and optimization.
          </p>
          <Link
            href={routes.rotations.index}
            role="button"
            className="secondary"
          >
            View Rotations
          </Link>
        </article>
      </div>

      <section>
        <h2>Features</h2>
        <div className="grid">
          <div>
            <h4>Accurate Simulations</h4>
            <p>
              High-fidelity combat simulation engine written in Rust for speed
              and accuracy.
            </p>
          </div>
          <div>
            <h4>Distributed Computing</h4>
            <p>Contribute computing power to the network and earn rewards.</p>
          </div>
          <div>
            <h4>Open Source</h4>
            <p>Fully transparent simulation logic and rotation definitions.</p>
          </div>
        </div>
      </section>
    </>
  );
}
