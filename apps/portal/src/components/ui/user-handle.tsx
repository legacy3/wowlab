import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const userHandleVariants = cva(
  "font-semibold transition-colors hover:text-primary",
  {
    variants: {
      size: {
        default: "text-base",
        sm: "text-sm",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

interface UserHandleProps extends VariantProps<typeof userHandleVariants> {
  handle: string;
  linkTo?: string | false;
  className?: string;
}

export function UserHandle({
  handle,
  linkTo,
  size,
  className,
}: UserHandleProps) {
  const displayHandle = `@${handle}`;
  const href = linkTo === false ? undefined : (linkTo ?? `/users/${handle}`);

  if (!href) {
    return (
      <span
        data-slot="user-handle"
        className={cn(userHandleVariants({ size }), className)}
      >
        {displayHandle}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-slot="user-handle"
      className={cn(userHandleVariants({ size }), className)}
    >
      {displayHandle}
    </Link>
  );
}
