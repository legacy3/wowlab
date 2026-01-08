import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      {[1, 2, 3].map((i) => (
        <article key={i}>
          <Skeleton height="6rem" />
        </article>
      ))}
    </div>
  );
}
