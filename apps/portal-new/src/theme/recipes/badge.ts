import { defineRecipe } from "@pandacss/dev";

export const badge = defineRecipe({
  base: {
    alignItems: "center",
    borderRadius: "l2",
    display: "inline-flex",
    fontVariantNumeric: "tabular-nums",
    fontWeight: "medium",
    lineHeight: "1",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  className: "badge",
  defaultVariants: {
    size: "md",
    variant: "subtle",
  },
  variants: {
    size: {
      "2xl": {
        _icon: { boxSize: "4.5" },
        fontSize: "md",
        gap: "1.5",
        h: "7",
        px: "3",
      },
      lg: {
        _icon: { boxSize: "3.5" },
        fontSize: "xs",
        gap: "1",
        h: "5.5",
        px: "2.5",
      },
      md: {
        _icon: { boxSize: "3" },
        fontSize: "xs",
        gap: "1",
        h: "5",
        px: "2",
      },
      sm: {
        _icon: { boxSize: "2.5" },
        fontSize: "xs",
        gap: "0.5",
        h: "4.5",
        px: "1.5",
      },
      xl: {
        _icon: { boxSize: "4" },
        fontSize: "sm",
        gap: "1.5",
        h: "6",
        px: "2.5",
      },
    },
    variant: {
      outline: {
        borderColor: "colorPalette.outline.border",
        borderWidth: "1px",
        color: "colorPalette.outline.fg",
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
