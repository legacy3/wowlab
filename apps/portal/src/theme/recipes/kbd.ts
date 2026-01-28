import { defineRecipe } from "@pandacss/dev";

export const kbd = defineRecipe({
  base: {
    alignItems: "center",
    borderRadius: "l2",
    display: "inline-flex",
    flexShrink: "0",
    fontFamily: "code",
    fontWeight: "medium",
    justifyContent: "center",
    userSelect: "none",
    whiteSpace: "nowrap",
    wordSpacing: "-0.5em",
  },
  className: "kbd",

  defaultVariants: {
    size: "md",
    variant: "subtle",
  },

  variants: {
    size: {
      lg: { height: "5.5", minWidth: "5.5", px: "1", textStyle: "sm" },
      md: { height: "5", minWidth: "5", px: "1", textStyle: "sm" },
      sm: { height: "4.5", minWidth: "4.5", px: "1", textStyle: "xs" },
      xl: { height: "6", minWidth: "6", px: "1", textStyle: "md" },
    },
    variant: {
      outline: {
        borderColor: "colorPalette.outline.border",
        borderWidth: "1px",
        color: "colorPalette.outline.fg",
      },
      plain: {
        color: "colorPalette.plain.fg",
      },
      solid: {
        bg: "colorPalette.solid.bg",
        color: "colorPalette.solid.fg",
      },
      subtle: {
        bg: "colorPalette.subtle.bg",
        color: "colorPalette.subtle.fg",
      },
      surface: {
        bg: "colorPalette.surface.bg",
        borderColor: "colorPalette.surface.border",
        borderWidth: "1px",
        color: "colorPalette.surface.fg",
      },
    },
  },
});
