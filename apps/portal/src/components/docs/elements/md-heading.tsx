import { cn } from "@/lib/utils";

type MdHeadingProps = {
  level: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
};

const styles = {
  1: "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
  2: "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  3: "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
  4: "mt-6 scroll-m-20 text-xl font-semibold tracking-tight",
};

export function MdHeading({ level, children, className }: MdHeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cn(styles[level], className)}>{children}</Tag>;
}

export function MdH1({ children, className }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={1} className={className}>
      {children}
    </MdHeading>
  );
}

export function MdH2({ children, className }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={2} className={className}>
      {children}
    </MdHeading>
  );
}

export function MdH3({ children, className }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={3} className={className}>
      {children}
    </MdHeading>
  );
}

export function MdH4({ children, className }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={4} className={className}>
      {children}
    </MdHeading>
  );
}
