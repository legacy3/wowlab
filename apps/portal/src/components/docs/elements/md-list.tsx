import { cn } from "@/lib/utils";

type MdListProps = {
  children: React.ReactNode;
  className?: string;
};

export function MdUl({ children, className }: MdListProps) {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
      {children}
    </ul>
  );
}

export function MdOl({ children, className }: MdListProps) {
  return (
    <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}>
      {children}
    </ol>
  );
}

export function MdLi({ children, className }: MdListProps) {
  return <li className={className}>{children}</li>;
}
