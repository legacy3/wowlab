import type { RecipeConfig } from "@pandacss/dev";

export const input = {
  base: {
    _disabled: {
      layerStyle: "disabled",
    },
    appearance: "none",
    borderRadius: "l2",
    height: "var(--input-height)",
    minHeight: "var(--input-height)",
    minW: "var(--input-height)",
    outline: "0",
    position: "relative",
    textAlign: "start",
    transition: "colors",
    width: "100%",
  },
  className: "input",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  jsx: ["Input", "Field.Input"],
  variants: {
    size: {
      "2xl": { "--input-height": "sizes.16", px: "4.5", textStyle: "3xl" },
      "2xs": { "--input-height": "sizes.7", px: "1.5", textStyle: "xs" },
      lg: { "--input-height": "sizes.11", px: "3.5", textStyle: "md" },
      md: { "--input-height": "sizes.10", px: "3", textStyle: "md" },
      sm: { "--input-height": "sizes.9", px: "2.5", textStyle: "sm" },
      xl: { "--input-height": "sizes.12", px: "4", textStyle: "lg" },
      xs: { "--input-height": "sizes.8", px: "2", textStyle: "sm" },
    },
    variant: {
      flushed: {
        _focus: {
          _invalid: {
            borderColor: "error",
            boxShadowColor: "error",
          },
          borderColor: "colorPalette.solid.bg",
          boxShadow: "0 1px 0 0 var(--shadow-color)",
          boxShadowColor: "colorPalette.solid.bg",
        },
        _invalid: {
          borderColor: "error",
        },
        borderBottomColor: "gray.outline.border",
        borderBottomWidth: "1px",
        borderRadius: "0",
        color: "fg.default",
        px: "0",
      },
      outline: {
        _invalid: {
          borderColor: "error",
          focusRingColor: "error",
        },
        borderColor: "gray.outline.border",
        borderWidth: "1px",
        focusVisibleRing: "inside",
      },
      subtle: {
        _invalid: {
          borderColor: "error",
          focusRingColor: "error",
        },
        bg: "gray.subtle.bg",
        borderColor: "transparent",
        borderWidth: "1px",
        color: "gray.subtle.fg",

        focusVisibleRing: "inside",
      },
      surface: {
        _invalid: {
          borderColor: "error",
          focusRingColor: "error",
        },
        bg: "gray.surface.bg",
        borderColor: "gray.surface.border",
        borderWidth: "1px",

        focusVisibleRing: "inside",
      },
    },
  },
} satisfies RecipeConfig;
