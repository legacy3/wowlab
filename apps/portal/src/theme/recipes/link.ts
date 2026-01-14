import { defineRecipe } from "@pandacss/dev";

export const link = defineRecipe({
  base: {
    _icon: {
      boxSize: "1em",
    },
    alignItems: "center",
    borderRadius: "l1",
    cursor: "pointer",
    display: "inline-flex",
    focusVisibleRing: "outside",
    fontWeight: "medium",
    gap: "1.5",
    outline: "none",
    textDecorationLine: "underline",
    textDecorationThickness: "0.1em",
    textUnderlineOffset: "0.125em",
    transitionDuration: "normal",
    transitionProperty: "text-decoration-color",
  },
  className: "link",
  defaultVariants: {
    variant: "underline",
  },
  variants: {
    variant: {
      plain: {
        _hover: {
          textDecorationColor: "colorPalette.surface.fg",
        },
        textDecorationColor: "transparent",
      },
      underline: {
        _hover: {
          textDecorationColor: "colorPalette.surface.fg",
        },
        textDecorationColor: "colorPalette.surface.fg/60",
      },
    },
  },
});
