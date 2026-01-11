import { defineRecipe } from "@pandacss/dev";

export const image = defineRecipe({
  base: {
    borderRadius: "md",
    height: "auto",
  },
  className: "image",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: {
        width: "100%",
      },
      modal: {
        maxHeight: "85vh",
        objectFit: "contain",
        width: "90vw",
      },
    },
  },
});
