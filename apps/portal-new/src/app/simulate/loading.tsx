import { Skeleton } from "@/components/ui/skeleton";

export default function SimulateLoading() {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      {[1, 2].map((i) => (
        <article key={i}>
          <header>
            <Skeleton width={i === 1 ? "5rem" : "7rem"} height="1.25rem" />
          </header>
          <p>
            <Skeleton height="1rem" />
          </p>
        </article>
      ))}
    </div>
  );
}
