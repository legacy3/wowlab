import { defineRecipe } from "@pandacss/dev";

export const textarea = defineRecipe({
  base: {
    _disabled: {
      layerStyle: "disabled",
    },
    appearance: "none",
    borderRadius: "l2",
    minWidth: "0",
    outline: "0",
    position: "relative",
    transition: "colors",
    transitionProperty: "box-shadow, border-color",
    width: "100%",
  },
  className: "textarea",
  defaultVariants: {
    size: "md",
    variant: "surface",
  },
  variants: {
    size: {
      lg: { px: "3.5", py: "9px", scrollPaddingBottom: "9px", textStyle: "md" },
      md: { px: "3", py: "7px", scrollPaddingBottom: "7px", textStyle: "md" },
      sm: { px: "2.5", py: "7px", scrollPaddingBottom: "7px", textStyle: "sm" },
      xl: { px: "4", py: "9px", scrollPaddingBottom: "9px", textStyle: "lg" },
      xs: { px: "2", py: "5px", scrollPaddingBottom: "5px", textStyle: "sm" },
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
});
