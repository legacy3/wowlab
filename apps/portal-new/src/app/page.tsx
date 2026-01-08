import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <header>
        <nav>
          <ul>
            <li><Link href="/"><strong>WowLab</strong></Link></li>
          </ul>
          <ul>
            <li><Link href="/simulate">Simulate</Link></li>
            <li><Link href="/talents">Talents</Link></li>
            <li><Link href="/demo">Components</Link></li>
          </ul>
        </nav>
      </header>

      <section>
        <hgroup>
          <h1>WowLab Portal</h1>
          <p>Simulation and theorycrafting tools for World of Warcraft</p>
        </hgroup>

        <div className="grid">
          <article>
            <h3>Simulate</h3>
            <p>Run DPS simulations with customizable parameters and rotation configurations.</p>
            <Link href="/simulate" role="button">Get Started</Link>
          </article>

          <article>
            <h3>Talents</h3>
            <p>Explore and compare talent builds across all classes and specializations.</p>
            <Link href="/talents" role="button" className="secondary">Browse Talents</Link>
          </article>

          <article>
            <h3>Rotations</h3>
            <p>Build and share rotation profiles for simulation and optimization.</p>
            <Link href="/rotations" role="button" className="secondary">View Rotations</Link>
          </article>
        </div>
      </section>

      <section>
        <h2>Features</h2>
        <div className="grid">
          <div>
            <h4>Accurate Simulations</h4>
            <p>High-fidelity combat simulation engine written in Rust for speed and accuracy.</p>
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

      <footer>
        <p><small>WowLab &copy; 2025</small></p>
      </footer>
    </main>
  );
}
