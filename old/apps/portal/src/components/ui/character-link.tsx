import type { ComponentProps } from "react";
import NextLink from "next/link";
import { ExternalLink } from "lucide-react";

import { playerRoute } from "@/lib/routes";
import { Button } from "./button";
import { Link } from "./link";

export type CharacterIdentifier = {
  name: string;
  region: string;
  realm: string;
};

type CharacterLinkProps = {
  character: CharacterIdentifier;
  className?: string;
  children?: React.ReactNode;
};

export function CharacterLink({
  character,
  className,
  children,
}: CharacterLinkProps) {
  const href = playerRoute({
    region: character.region,
    realm: character.realm,
    name: character.name,
  });

  return (
    <Link href={href} className={className}>
      {children ?? character.name}
    </Link>
  );
}

type CharacterLinkButtonProps = Omit<
  ComponentProps<typeof Button>,
  "asChild"
> & {
  character: CharacterIdentifier;
  showIcon?: boolean;
};

export function CharacterLinkButton({
  character,
  showIcon = true,
  children,
  ...props
}: CharacterLinkButtonProps) {
  const href = playerRoute({
    region: character.region,
    realm: character.realm,
    name: character.name,
  });

  return (
    <Button asChild {...props}>
      <NextLink href={href}>
        {children ?? "View Profile"}
        {showIcon && <ExternalLink className="ml-1 h-3 w-3" />}
      </NextLink>
    </Button>
  );
}
