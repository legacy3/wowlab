import { defineRecipe } from "@pandacss/dev";

export const heading = defineRecipe({
  base: {
    color: "fg.default",
    fontWeight: "semibold",
  },
  className: "heading",
  defaultVariants: {
    size: "xl",
  },
  jsx: ["Heading"],
  variants: {
    size: {
      "2xl": { textStyle: "2xl" },
      "3xl": { textStyle: "3xl" },
      "4xl": { textStyle: "4xl" },
      "5xl": { textStyle: "5xl" },
      "6xl": { textStyle: "6xl" },
      "7xl": { textStyle: "7xl" },
      lg: { textStyle: "lg" },
      md: { textStyle: "md" },
      sm: { textStyle: "sm" },
      xl: { textStyle: "xl" },
      xs: { textStyle: "xs" },
    },
  },
});
