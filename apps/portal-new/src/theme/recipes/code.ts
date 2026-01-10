import { defineRecipe } from "@pandacss/dev";

export const code = defineRecipe({
  base: {
    alignItems: "center",
    borderRadius: "l2",
    display: "inline-flex",
    fontFamily: "code",
    fontVariantNumeric: "tabular-nums",
    fontWeight: "medium",
    gap: "1",
    lineHeight: "1",
  },
  className: "code",
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
