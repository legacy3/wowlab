import NextLink from "next/link";

import { Link } from "@/components/ui/link";
import { getFirstSlug } from "@/lib/docs";

export default function DocsIndexPage() {
  return (
    <Link asChild>
      <NextLink href={`/docs/${getFirstSlug()}`}>
        Get started with the overview →
      </NextLink>
    </Link>
  );
}
