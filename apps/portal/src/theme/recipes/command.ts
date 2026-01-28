import { defineSlotRecipe } from "@pandacss/dev";

const slots = [
  "root",
  "inputWrapper",
  "input",
  "list",
  "empty",
  "group",
  "item",
  "separator",
  "shortcut",
];

export const command = defineSlotRecipe({
  base: {
    empty: {
      color: "fg.muted",
      py: "6",
      textAlign: "center",
      textStyle: "sm",
    },
    group: {
      "& [cmdk-group-heading]": {
        color: "fg.muted",
        fontWeight: "medium",
        px: "2",
        py: "1.5",
        textStyle: "xs",
      },
      color: "fg.default",
      overflow: "hidden",
      p: "1",
    },
    input: {
      _disabled: { cursor: "not-allowed", opacity: "0.5" },
      _placeholder: { color: "fg.muted" },
      bg: "transparent",
      display: "flex",
      outline: "none",
      py: "3",
      textStyle: "sm",
      width: "full",
    },
    inputWrapper: {
      alignItems: "center",
      borderBottomWidth: "1",
      borderColor: "border.default",
      display: "flex",
      gap: "2",
      h: "12",
      px: "3",
    },
    item: {
      _hover: { bg: "gray.3" },
      '&[data-disabled="true"]': {
        opacity: "0.5",
        pointerEvents: "none",
      },
      '&[data-selected="true"]': {
        bg: "gray.3",
      },
      "& svg": {
        flexShrink: 0,
      },
      alignItems: "center",
      cursor: "pointer",
      display: "flex",
      gap: "2.5",
      position: "relative",
      px: "2",
      py: "2",
      rounded: "sm",
      textStyle: "sm",
      transition: "colors",
      userSelect: "none",
    },
    list: {
      maxH: "80",
      overflowX: "hidden",
      overflowY: "auto",
      scrollPaddingY: "1",
    },
    root: {
      bg: "bg.default",
      color: "fg.default",
      display: "flex",
      flexDirection: "column",
      height: "full",
      overflow: "hidden",
      rounded: "md",
      width: "full",
    },
    separator: {
      bg: "border.default",
      h: "px",
      mx: "-1",
    },
    shortcut: {
      color: "fg.muted",
      letterSpacing: "widest",
      ml: "auto",
      textStyle: "xs",
    },
  },
  className: "command",
  slots,
});
