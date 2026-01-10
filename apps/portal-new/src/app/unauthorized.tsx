"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Unauthorized() {
  const pathname = usePathname();

  return (
    <div>
      <h2>Unauthorized</h2>
      <p>Please sign in to access this page.</p>
      <Link href={`/auth/sign-in?next=${encodeURIComponent(pathname)}`}>
        Sign In
      </Link>
    </div>
  );
}
