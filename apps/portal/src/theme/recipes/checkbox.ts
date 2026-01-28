import { checkboxAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const checkbox = defineSlotRecipe({
  base: {
    control: {
      _icon: {
        boxSize: "full",
      },
      alignItems: "center",
      borderColor: "transparent",
      borderRadius: "l1",
      borderWidth: "1px",
      cursor: "pointer",
      display: "inline-flex",
      flexShrink: "0",
      focusVisibleRing: "outside",

      justifyContent: "center",
    },
    label: {
      fontWeight: "medium",
      userSelect: "none",
    },
    root: {
      _disabled: {
        layerStyle: "disabled",
      },
      alignItems: "center",
      display: "inline-flex",
      gap: "2",
      position: "relative",
      verticalAlign: "top",
    },
  },
  className: "checkbox",
  defaultVariants: {
    size: "md",
    variant: "solid",
  },

  slots: checkboxAnatomy.keys(),

  variants: {
    size: {
      lg: {
        control: { _icon: { boxSize: "4" }, boxSize: "5.5" },
        label: { textStyle: "lg" },
        root: { gap: "3" },
      },
      md: {
        control: { _icon: { boxSize: "3.5" }, boxSize: "5" },
        label: { textStyle: "md" },
        root: { gap: "3" },
      },
      sm: {
        control: { _icon: { boxSize: "3" }, boxSize: "4.5" },
        label: { textStyle: "sm" },
        root: { gap: "2" },
      },
    },

    variant: {
      outline: {
        control: {
          _checked: {
            borderColor: "colorPalette.solid.bg",
          },
          borderColor: "colorPalette.outline.border",
          borderWidth: "1px",
          color: "colorPalette.outline.fg",
        },
      },
      plain: {
        control: {
          color: "colorPalette.plain.fg",
        },
      },
      solid: {
        control: {
          _checked: {
            bg: "colorPalette.solid.bg",
            borderColor: "colorPalette.solid.bg",
            color: "colorPalette.solid.fg",
          },
          _invalid: {
            background: "error",
          },
          borderColor: "border",
        },
      },
      subtle: {
        control: {
          bg: "colorPalette.subtle.bg",
          color: "colorPalette.subtle.fg",
        },
      },
      surface: {
        control: {
          bg: "colorPalette.surface.bg",
          borderColor: "colorPalette.surface.border",
          borderWidth: "1px",
          color: "colorPalette.surface.fg",
        },
      },
    },
  },
});
