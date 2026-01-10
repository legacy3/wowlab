import { defineSlotRecipe } from "@pandacss/dev";

export const table = defineSlotRecipe({
  base: {
    caption: {
      color: "fg.subtle",
      fontWeight: "medium",
    },
    cell: {
      _pinned: {
        bg: "inherit",
        boxShadow: "inset 0 -1px 0 0 var(--shadow-color)",
        overflow: "unset",
        position: "sticky",
        shadowColor: "border",
        zIndex: 1,
      },
      alignItems: "center",
      boxShadow: "inset 0 -1px 0 0 var(--shadow-color)",
      color: "fg.muted",
      overflow: "hidden",
      shadowColor: "border",
      textAlign: "start",
      textOverflow: "ellipsis",
      textStyle: "sm",
      whiteSpace: "nowrap",
    },
    foot: {
      "& td": {
        boxShadow: "inset 0 1px 0 0 var(--shadow-color)!",
        shadowColor: "border",
      },
      fontWeight: "medium",
    },
    head: {
      color: "fg.muted",
      fontWeight: "semibold",
      textAlign: "start",
      textStyle: "xs",
      whiteSpace: "nowrap",
    },
    header: {
      _pinned: {
        bg: "inherit",
        position: "sticky",
        zIndex: 2,
      },
      boxShadow: "inset 0 -1px 0 0 var(--shadow-color)",
      shadowColor: "border",
      textAlign: "left",
      verticalAlign: "middle",
    },
    root: {
      borderCollapse: "collapse",
      fontVariantNumeric: "lining-nums tabular-nums",
      textAlign: "start",
      verticalAlign: "top",
      width: "full",
    },
    row: {
      _last: { "& td": { boxShadow: "none" } },
    },
  },
  className: "table",
  defaultVariants: {
    size: "md",
    variant: "plain",
  },
  slots: ["root", "body", "cell", "foot", "head", "header", "row", "caption"],
  variants: {
    columnBorder: {
      true: {
        cell: { "&:not(:last-of-type)": { borderInlineEndWidth: "1px" } },
        header: { "&:not(:last-of-type)": { borderInlineEndWidth: "1px" } },
      },
    },
    interactive: {
      true: {
        body: { "& tr": { _hover: { bg: "gray.surface.bg.hover" } } },
      },
    },
    size: {
      lg: {
        cell: { px: "4", py: "4" },
        header: { px: "4", py: "4" },
        root: { textStyle: "md" },
      },
      md: {
        cell: { px: "3", py: "3" },
        header: { px: "3", py: "3" },
        root: { textStyle: "sm" },
      },
      sm: {
        cell: { px: "2", py: "2" },
        header: { px: "2", py: "2" },
        root: { textStyle: "xs" },
      },
    },
    stickyHeader: {
      true: {
        head: {
          "& :where(tr)": {
            position: "sticky",
            top: "var(--table-sticky-offset, 0)",
            zIndex: 2,
          },
        },
      },
    },
    striped: {
      true: {
        row: { "&:nth-of-type(odd) td": { bg: "gray.surface.bg.hover" } },
      },
    },
    variant: {
      plain: {},
      surface: {
        header: { bg: "gray.surface.bg.hover" },
        row: { bg: "gray.surface.bg" },
      },
    },
  },
});
