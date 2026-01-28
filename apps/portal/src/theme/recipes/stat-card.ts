import { defineSlotRecipe } from "@pandacss/dev";

export const statCard = defineSlotRecipe({
  base: {
    icon: {
      color: "fg.muted",
      flexShrink: 0,
    },
    label: {
      color: "fg.muted",
    },
    labelGroup: {
      alignItems: "center",
      color: "fg.muted",
      display: "flex",
      gap: "2",
      justifyContent: "center",
    },
    root: {
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      height: "full",
      justifyContent: "center",
      textAlign: "center",
    },
    value: {
      fontVariantNumeric: "tabular-nums",
      fontWeight: "bold",
      mt: "1",
    },
  },
  className: "statCard",
  defaultVariants: {
    size: "md",
  },
  slots: ["root", "labelGroup", "icon", "label", "value"],
  variants: {
    size: {
      md: {
        icon: { height: "3.5", width: "3.5" },
        label: { textStyle: "xs" },
        root: { p: "4" },
        value: { textStyle: "2xl" },
      },
      sm: {
        icon: { height: "3", width: "3" },
        label: { textStyle: "xs" },
        root: { p: "3" },
        value: { textStyle: "xl" },
      },
    },
  },
});
