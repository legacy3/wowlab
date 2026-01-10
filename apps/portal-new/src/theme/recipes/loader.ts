import { defineRecipe } from "@pandacss/dev";

export const loader = defineRecipe({
  base: {
    alignItems: "center",
    display: "inline-flex",
    flexShrink: 0,
    justifyContent: "center",
  },
  className: "loader",
  defaultVariants: {
    size: "md",
  },
  jsx: ["Loader", "InlineLoader", "PageLoader", "CardLoader", "OverlayLoader"],
  variants: {
    size: {
      lg: { height: "16", width: "16" },
      md: { height: "12", width: "12" },
      sm: { height: "6", width: "6" },
      xl: { height: "24", width: "24" },
      xs: { height: "4", width: "4" },
    },
  },
});
