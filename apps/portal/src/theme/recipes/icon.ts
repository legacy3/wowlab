import { defineRecipe } from "@pandacss/dev";

export const icon = defineRecipe({
  base: {
    color: "currentcolor",
    display: "inline-block",
    flexShrink: "0",
    lineHeight: "1em",
    verticalAlign: "middle",
  },
  className: "icon",
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      "2xs": { boxSize: "3" },
      lg: { boxSize: "5.5" },
      md: { boxSize: "5" },
      sm: { boxSize: "4.5" },
      xl: { boxSize: "6" },
      xs: { boxSize: "4" },
    },
  },
});
