import { radioGroupAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const radioCardGroup = defineSlotRecipe({
  base: {
    item: {
      alignItems: "center",
      borderRadius: "l2",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      userSelect: "none",
      width: "full",
    },
    itemControl: {
      _after: {
        borderRadius: "full",
        content: '""',
        display: "block",
      },
      _focusVisible: {
        focusVisibleRing: "outside",
      },
      alignItems: "center",
      borderRadius: "full",
      display: "inline-flex",
      flexShrink: "0",
      justifyContent: "center",
      verticalAlign: "top",
    },
    itemText: {
      textStyle: "label",
    },
    label: {
      textStyle: "label",
    },
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
      width: "full",
    },
  },
  className: "radio-card-group",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  slots: radioGroupAnatomy.keys(),
  variants: {
    size: {
      md: {
        item: { gap: "2", p: "4" },
        itemControl: { _after: { boxSize: "2" }, boxSize: "5" },
        itemText: { textStyle: "sm" },
      },
    },
    variant: {
      outline: {
        item: {
          _checked: {
            borderColor: "colorPalette.solid.bg",
            boxShadow: "0 0 0 1px var(--shadow-color)",
            boxShadowColor: "colorPalette.solid.bg",
          },
          borderColor: "gray.outline.border",
          borderWidth: "1px",
        },
        itemControl: {
          _checked: {
            _after: {
              background: "colorPalette.solid.fg",
            },
            bg: "colorPalette.solid.bg",
            borderColor: "colorPalette.solid.bg",
          },
          borderColor: "gray.outline.border",
          borderWidth: "1px",
        },
      },
      solid: {
        item: {
          _checked: {
            bg: "colorPalette.solid.bg",
            borderColor: "colorPalette.solid.bg",
            color: "colorPalette.solid.fg",
          },
          borderWidth: "1px",
        },
        itemControl: {
          _checked: {
            _after: {
              bg: "colorPalette.solid.bg",
            },
            background: "colorPalette.solid.fg",
            borderColor: "colorPalette.solid.fg",
          },
          borderColor: "gray.outline.border",
          borderWidth: "1px",
        },
      },
      subtle: {
        item: {
          _checked: {
            background: "colorPalette.subtle.bg",
            color: "colorPalette.subtle.fg",
          },
          background: "gray.subtle.bg",
          color: "gray.subtle.fg",
        },
        itemControl: {
          _checked: {
            _after: {
              bg: "colorPalette.solid.bg",
            },
            borderColor: "colorPalette.solid.bg",
          },
          borderColor: "gray.subtle.border",
          borderWidth: "1px",
        },
      },
      surface: {
        item: {
          _checked: {
            borderColor: "colorPalette.solid.bg",
            boxShadow: "0 0 0 1px var(--shadow-color)",
            boxShadowColor: "colorPalette.solid.bg",
          },
          background: "gray.surface.bg",
          borderColor: "gray.surface.border",
          borderWidth: "1px",
          color: "gray.surface.fg",
        },
        itemControl: {
          _checked: {
            _after: {
              background: "colorPalette.solid.fg",
            },
            background: "colorPalette.solid.bg",
            borderColor: "colorPalette.solid.bg",
          },
          borderColor: "gray.outline.border",
          borderWidth: "1px",
        },
      },
    },
  },
});
