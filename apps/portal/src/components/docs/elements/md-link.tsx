import { Link } from "@/components/ui/link";

type MdLinkProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
};

export function MdLink({ href, children, className }: MdLinkProps) {
  if (!href) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} external={href.startsWith("http")} className={className}>
      {children}
    </Link>
  );
}
