import { cn } from "@/lib/utils";

type MdParagraphProps = {
  children: React.ReactNode;
  className?: string;
};

export function MdParagraph({ children, className }: MdParagraphProps) {
  return (
    <p className={cn("leading-7 not-first:mt-6", className)}>{children}</p>
  );
}

export function MdLead({ children, className }: MdParagraphProps) {
  return (
    <p className={cn("text-muted-foreground text-xl leading-7", className)}>
      {children}
    </p>
  );
}

export function MdMuted({ children, className }: MdParagraphProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)}>{children}</p>
  );
}

export function MdBlockquote({ children, className }: MdParagraphProps) {
  return (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
      {children}
    </blockquote>
  );
}
