"use client";

import { SearchIcon } from "lucide-react";
import { css } from "styled-system/css";

import { Button, Kbd } from "@/components/ui";
import { useDocsSearch } from "@/providers";

export function DocsSearchButton() {
  const { openSearch } = useDocsSearch();

  return (
    <Button
      variant="outline"
      onClick={openSearch}
      className={css({ justifyContent: "space-between", minW: "200px" })}
    >
      <span
        className={css({ alignItems: "center", display: "flex", gap: "2" })}
      >
        <SearchIcon size={16} />
        Search docs...
      </span>
      <Kbd>⌘K</Kbd>
    </Button>
  );
}
