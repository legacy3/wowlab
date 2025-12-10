import { cn } from "@/lib/utils";

type MdTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function MdTable({ children, className }: MdTableProps) {
  return (
    <div className={cn("my-6 w-full overflow-y-auto", className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function MdThead({ children, className }: MdTableProps) {
  return <thead className={cn("bg-muted/50", className)}>{children}</thead>;
}

export function MdTbody({ children, className }: MdTableProps) {
  return <tbody className={className}>{children}</tbody>;
}

export function MdTr({ children, className }: MdTableProps) {
  return (
    <tr className={cn("border-b border-border", className)}>{children}</tr>
  );
}

export function MdTh({ children, className }: MdTableProps) {
  return (
    <th
      className={cn(
        "border border-border px-4 py-2 text-left font-semibold text-foreground [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function MdTd({ children, className }: MdTableProps) {
  return (
    <td
      className={cn(
        "border border-border px-4 py-2 text-left text-muted-foreground [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
