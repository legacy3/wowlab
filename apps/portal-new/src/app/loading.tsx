import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1.5rem",
      }}
    >
      <Skeleton height="2rem" width="12rem" />
      <Skeleton height="1rem" width="20rem" />
    </div>
  );
}
