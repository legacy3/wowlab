import { defineRecipe } from "@pandacss/dev";

export const helpText = defineRecipe({
  base: {
    _hover: {
      borderBottomColor: "border.default",
    },
    borderBottomColor: "border.subtle",
    borderBottomStyle: "dotted",
    borderBottomWidth: "1px",
    cursor: "help",
    transitionDuration: "normal",
    transitionProperty: "border-color",
  },
  className: "helpText",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: {},
      link: {
        cursor: "pointer",
      },
    },
  },
});
