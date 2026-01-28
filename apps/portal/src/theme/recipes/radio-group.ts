import { radioGroupAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const radioGroup = defineSlotRecipe({
  base: {
    item: {
      _disabled: {
        layerStyle: "disabled",
      },
      alignItems: "center",
      cursor: "pointer",
      display: "flex",
    },
    itemControl: {
      _after: {
        borderRadius: "full",
        boxSize: "40%",
        content: '""',
        display: "block",
      },
      _focusVisible: {
        focusVisibleRing: "outside",
      },
      alignItems: "center",
      borderRadius: "full",
      display: "inline-flex",
      flexShrink: 0,
      justifyContent: "center",
      verticalAlign: "top",
    },
    itemText: {
      fontWeight: "medium",
      userSelect: "none",
    },
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "3",
    },
  },
  className: "radio-group",
  defaultVariants: {
    size: "md",
    variant: "solid",
  },
  slots: radioGroupAnatomy.keys(),
  variants: {
    size: {
      lg: {
        item: { gap: "3" },
        itemControl: { boxSize: "5.5" },
        itemText: { textStyle: "lg" },
      },
      md: {
        item: { gap: "3" },
        itemControl: { boxSize: "5" },
        itemText: { textStyle: "md" },
      },
      sm: {
        item: { gap: "2" },
        itemControl: { boxSize: "4.5" },
        itemText: { textStyle: "sm" },
      },
    },
    variant: {
      solid: {
        itemControl: {
          _checked: {
            _after: {
              background: "colorPalette.solid.fg",
            },
            bg: "colorPalette.solid.bg",
            boxShadowColor: "colorPalette.solid.bg",
            color: "colorPalette.solid.fg",
          },
          boxShadow: "inset 0 0 0 1px var(--shadow-color)",
          boxShadowColor: "gray.surface.border",
        },
      },
    },
  },
});
