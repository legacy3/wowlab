import { defineRecipe } from "@pandacss/dev";

export const code = defineRecipe({
  base: {
    bg: "gray.a3",
    borderRadius: "sm",
    color: "fg.default",
    fontFamily: "code",
    fontSize: "0.875em",
    fontWeight: "medium",
    px: "1.5",
    py: "0.5",
  },
  className: "code",
  defaultVariants: {
    block: false,
  },
  variants: {
    block: {
      true: {
        borderRadius: "lg",
        display: "block",
        fontSize: "sm",
        lineHeight: "relaxed",
        my: "6",
        overflow: "auto",
        p: "4",
        whiteSpace: "pre",
      },
    },
  },
});
