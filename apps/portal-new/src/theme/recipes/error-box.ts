import { defineRecipe } from "@pandacss/dev";

export const errorBox = defineRecipe({
  base: {
    bg: "red.2",
    borderColor: "red.6",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "red.11",
    fontFamily: "mono",
    overflow: "auto",
    p: "3",
    textStyle: "xs",
    whiteSpace: "pre-wrap",
  },
  className: "errorBox",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: {},
      subtle: {
        bg: "red.1",
        borderColor: "red.4",
      },
    },
  },
});
