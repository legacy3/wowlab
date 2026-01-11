import type { ReactNode } from "react";

import { Link as LinkIcon } from "lucide-react";
import { Flex } from "styled-system/jsx";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";

type MdHeadingProps = {
  level: 2 | 3 | 4 | 5 | 6;
  id?: string;
  children: ReactNode;
};

const Tag = {
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

export function MdH2({ children, id }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={2} id={id}>
      {children}
    </MdHeading>
  );
}

export function MdH3({ children, id }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={3} id={id}>
      {children}
    </MdHeading>
  );
}

export function MdH4({ children, id }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={4} id={id}>
      {children}
    </MdHeading>
  );
}

export function MdH5({ children, id }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={5} id={id}>
      {children}
    </MdHeading>
  );
}

export function MdH6({ children, id }: Omit<MdHeadingProps, "level">) {
  return (
    <MdHeading level={6} id={id}>
      {children}
    </MdHeading>
  );
}

function MdHeading({ children, id, level }: MdHeadingProps) {
  const HeadingTag = Tag[level];

  return (
    <Flex
      as={HeadingTag}
      id={id}
      position="relative"
      scrollMarginTop="20"
      alignItems="center"
      gap="2"
      css={{
        "&:hover > a": { opacity: 1 },
        "& > a": { opacity: 0 },
      }}
    >
      {children}
      {id && (
        <Link
          href={`#${id}`}
          variant="plain"
          color="fg.muted"
          _hover={{ color: "fg.default" }}
          transition="opacity"
          aria-label="Link to this section"
        >
          <Icon size="sm">
            <LinkIcon />
          </Icon>
        </Link>
      )}
    </Flex>
  );
}
