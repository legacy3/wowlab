import { cn } from "@/lib/utils";
import { Link } from "lucide-react";

type MdHeadingProps = {
  level: 1 | 2 | 3 | 4;
  id?: string;
  children: React.ReactNode;
  className?: string;
};

const styles = {
  1: "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
  2: "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  3: "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
  4: "mt-6 scroll-m-20 text-xl font-semibold tracking-tight",
};

export function MdHeading({ level, id, children, className }: MdHeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag id={id} className={cn("group relative", styles[level], className)}>
      {children}
      {id && (
        <a
          href={`#${id}`}
          className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          aria-label="Link to this section"
        >
          <Link className="h-4 w-4" />
        </a>
      )}
    </Tag>
  );
}

export function MdH1({
  id,
  children,
  className,
}: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={1} id={id} className={className}>
      {children}
    </MdHeading>
  );
}

export function MdH2({
  id,
  children,
  className,
}: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={2} id={id} className={className}>
      {children}
    </MdHeading>
  );
}

export function MdH3({
  id,
  children,
  className,
}: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={3} id={id} className={className}>
      {children}
    </MdHeading>
  );
}

export function MdH4({
  id,
  children,
  className,
}: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={4} id={id} className={className}>
      {children}
    </MdHeading>
  );
}
