import { defineSlotRecipe } from "@pandacss/dev";

export const steps = defineSlotRecipe({
  base: {
    content: {
      width: "100%",
    },
    indicator: {
      fontVariantNumeric: "tabular-nums",
      marginRight: "2",
      opacity: "0.6",
    },
    list: {
      display: "flex",
      flexDirection: "row",
      isolation: "isolate",
      position: "relative",
    },
    root: {
      alignItems: "start",
      display: "flex",
      flexDirection: "column",
      gap: "2",
      position: "relative",
    },
    trigger: {
      _disabled: {
        cursor: "not-allowed",
        opacity: "0.5",
      },
      _focusVisible: {
        focusVisibleRing: "outside",
        zIndex: 1,
      },
      alignItems: "center",
      cursor: "pointer",
      display: "flex",
      fontWeight: "semibold",
      outline: "0",
      position: "relative",
    },
  },
  className: "steps",
  defaultVariants: {
    size: "md",
  },
  slots: ["root", "list", "trigger", "content", "indicator"],
  variants: {
    size: {
      lg: {
        list: { gap: "1" },
        trigger: { gap: "2", h: "11", minW: "11", px: "4.5", textStyle: "md" },
      },
      md: {
        list: { gap: "1" },
        trigger: { gap: "2", h: "10", minW: "10", px: "4", textStyle: "sm" },
      },
      sm: {
        list: { gap: "1" },
        trigger: { gap: "2", h: "9", minW: "9", px: "3.5", textStyle: "sm" },
      },
    },
  },
});
