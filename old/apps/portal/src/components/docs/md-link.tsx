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

  const isExternal = href.startsWith("http") || href.startsWith("/go/");

  return (
    <Link href={href} external={isExternal} className={className}>
      {children}
    </Link>
  );
}
