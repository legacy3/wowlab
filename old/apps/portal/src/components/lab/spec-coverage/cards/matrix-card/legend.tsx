import { cn } from "@/lib/utils";

export function Legend() {
  const items = [
    { color: "bg-rose-500", label: "0-30" },
    { color: "bg-amber-500", label: "30-50" },
    { color: "bg-amber-400", label: "50-70" },
    { color: "bg-emerald-400", label: "70-90" },
    { color: "bg-emerald-500", label: "90+" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide opacity-70">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <span className={cn("h-3 w-3 rounded-sm", color)} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
