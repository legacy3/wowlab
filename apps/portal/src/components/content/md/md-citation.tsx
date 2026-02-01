"use client";

import type { StaticImageData } from "next/image";

import { useBoolean } from "ahooks";
import { ArchiveIcon, ExternalLinkIcon, MapPinIcon } from "lucide-react";
import { Box, HStack, Stack } from "styled-system/jsx";

import { Badge, HoverCard, Link, Text } from "@/components/ui";
import {
  hasArchive,
  hasDoi,
  hasUrl,
  Reference,
  references,
} from "@/content/references";

import { MdImg } from "./md-img";

const LOCATORS = [
  { key: "s", prefix: "§" },
  { key: "p", prefix: "p. " },
  { key: "line", prefix: "line " },
  { key: "loc", prefix: "" },
] as const;

type LocatorKey = (typeof LOCATORS)[number]["key"];
type LocatorProps = Partial<Record<LocatorKey, string | number>>;

type MdCiteProps = {
  id: string;
  children?: React.ReactNode;
} & LocatorProps;

type RefScreenshotProps = {
  src: StaticImageData;
  alt: string;
  onClick?: () => void;
};

export function MdBibliography() {
  const allRefs = Object.entries(references);
  if (allRefs.length === 0) {
    return null;
  }

  return (
    <Stack gap="3">
      {allRefs.map(([id, ref], idx) => {
        const waybackUrl = getWaybackUrl(ref);

        return (
          <HStack
            key={id}
            id={`ref-${id}`}
            gap="4"
            alignItems="start"
            py="3"
            borderBottomWidth="1"
            borderColor="border.muted"
            _last={{ borderBottomWidth: 0 }}
          >
            <Badge
              variant="surface"
              colorPalette="amber"
              size="sm"
              flexShrink={0}
            >
              {idx + 1}
            </Badge>
            <Stack gap="2" flex="1" minW="0">
              <HStack gap="2" justify="space-between" alignItems="start">
                <Stack gap="0.5" flex="1" minW="0">
                  <Text fontWeight="medium">{ref.title}</Text>
                  <Text textStyle="xs" color="fg.muted">
                    {ref.authors} ({ref.year}).{" "}
                    <Text as="span" fontStyle="italic">
                      {ref.source}
                    </Text>
                    {hasArchive(ref) && (
                      <>
                        {" "}
                        Accessed {formatAccessedDate(ref.archive.accessedAt)}.
                      </>
                    )}
                  </Text>
                </Stack>
                <HStack gap="2" flexShrink={0}>
                  {waybackUrl && (
                    <Link
                      href={waybackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Wayback Machine archive"
                    >
                      <ArchiveIcon size={14} />
                    </Link>
                  )}
                  {getRefUrl(ref) && (
                    <Link
                      href={getRefUrl(ref)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Original source"
                    >
                      <ExternalLinkIcon size={14} />
                    </Link>
                  )}
                </HStack>
              </HStack>
              {hasArchive(ref) && (
                <Box maxW="sm">
                  <RefScreenshot src={ref.archive.screenshot} alt={ref.title} />
                </Box>
              )}
            </Stack>
          </HStack>
        );
      })}
    </Stack>
  );
}

export function MdCite({ children, id, ...locatorProps }: MdCiteProps) {
  const [open, { set: setOpen, setFalse: close }] = useBoolean(false);
  const ref = references[id];
  const num = Object.keys(references).indexOf(id) + 1;
  const location = formatLocation(locatorProps);

  if (!ref) {
    return (
      <Text as="span" textStyle="xs" color="red.11">
        {children} (?)
      </Text>
    );
  }

  return (
    <HoverCard.Root
      openDelay={200}
      closeDelay={100}
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      <HoverCard.Trigger asChild>
        <Link
          href={`/dev/docs/references#ref-${id}`}
          colorPalette="amber"
          whiteSpace="nowrap"
        >
          {children} ({num})
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content w="80" py="2" px="3">
          <HoverCard.Arrow>
            <HoverCard.ArrowTip />
          </HoverCard.Arrow>
          <Stack gap="2">
            {hasArchive(ref) && (
              <RefScreenshot
                src={ref.archive.screenshot}
                alt={ref.title}
                onClick={close}
              />
            )}
            <Stack gap="1">
              <Text textStyle="sm" fontWeight="semibold">
                {ref.title}
              </Text>
              <Text textStyle="xs" color="fg.muted">
                {ref.authors} ({ref.year})
              </Text>
              {location && (
                <HStack gap="1" color="fg.muted">
                  <MapPinIcon size={12} />
                  <Text textStyle="xs" fontFamily="mono">
                    {location}
                  </Text>
                </HStack>
              )}
              <HStack gap="2" justify="space-between">
                <Text textStyle="xs" color="fg.subtle" fontStyle="italic">
                  {ref.source}
                </Text>
                <RefLink reference={ref} />
              </HStack>
            </Stack>
          </Stack>
        </HoverCard.Content>
      </HoverCard.Positioner>
    </HoverCard.Root>
  );
}

function formatAccessedDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLocation(props: LocatorProps): string | undefined {
  const parts = LOCATORS.map(({ key, prefix }) => {
    const value = props[key];
    if (value === undefined) {
      return null;
    }
    return `${prefix}${value}`;
  }).filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function getRefUrl(ref: Reference): string | undefined {
  if (hasDoi(ref)) {
    return `https://doi.org/${ref.doi}`;
  }
  if (hasUrl(ref)) {
    return ref.url;
  }
  return undefined;
}

function getWaybackUrl(ref: Reference): string | undefined {
  if (!hasArchive(ref)) {
    return undefined;
  }
  const timestamp = ref.archive.accessedAt.replace(/-/g, "");
  return `https://web.archive.org/web/${timestamp}/${ref.url}`;
}

function RefLink({ reference }: { reference: Reference }) {
  const url = getRefUrl(reference);
  if (!url) {
    return null;
  }

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      textStyle="xs"
      colorPalette="amber"
    >
      <HStack gap="1">
        <Text as="span">{hasDoi(reference) ? "DOI" : "Link"}</Text>
        <ExternalLinkIcon size={12} />
      </HStack>
    </Link>
  );
}

function RefScreenshot({ alt, onClick, src }: RefScreenshotProps) {
  return (
    <Box
      borderRadius="md"
      overflow="hidden"
      borderWidth="1"
      borderColor="border.muted"
      onClick={onClick}
    >
      <MdImg src={src.src} alt={alt} />
    </Box>
  );
}
