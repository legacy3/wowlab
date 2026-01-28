import { defineRecipe } from "@pandacss/dev";

export const button = defineRecipe({
  base: {
    _disabled: {
      layerStyle: "disabled",
    },
    _icon: {
      flexShrink: "0",
    },
    alignItems: "center",
    appearance: "none",
    borderRadius: "l2",
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: "0",
    focusVisibleRing: "outside",
    fontWeight: "semibold",
    gap: "2",
    isolation: "isolate",
    justifyContent: "center",
    outline: "0",
    position: "relative",
    transition: "colors",
    transitionProperty: "background-color, border-color, color, box-shadow",
    userSelect: "none",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  className: "button",
  defaultVariants: {
    size: "md",
    variant: "solid",
  },
  jsx: ["Button", "IconButton", "CloseButton", "ButtonGroup"],
  variants: {
    size: {
      "2xl": {
        _icon: { boxSize: "6" },
        h: "16",
        minW: "16",
        px: "6",
        textStyle: "xl",
      },
      "2xs": {
        _icon: { boxSize: "3.5" },
        h: "6",
        minW: "6",
        px: "2",
        textStyle: "xs",
      },
      lg: {
        _icon: { boxSize: "5" },
        h: "11",
        minW: "11",
        px: "4",
        textStyle: "md",
      },
      md: {
        _icon: { boxSize: "5" },
        h: "10",
        minW: "10",
        px: "3.5",
        textStyle: "sm",
      },
      sm: {
        _icon: { boxSize: "4" },
        h: "9",
        minW: "9",
        px: "3",
        textStyle: "sm",
      },
      xl: {
        _icon: { boxSize: "5.5" },
        h: "12",
        minW: "12",
        px: "4.5",
        textStyle: "md",
      },
      xs: {
        _icon: { boxSize: "4" },
        h: "8",
        minW: "8",
        px: "2.5",
        textStyle: "sm",
      },
    },
    variant: {
      outline: {
        _active: {
          bg: "colorPalette.outline.bg.active",
        },
        _hover: {
          bg: "colorPalette.outline.bg.hover",
        },
        _on: {
          bg: "colorPalette.outline.bg.active",
        },
        borderColor: "colorPalette.outline.border",
        borderWidth: "1px",
        color: "colorPalette.outline.fg",
      },
      plain: {
        _active: {
          bg: "colorPalette.plain.bg.active",
        },
        _hover: {
          bg: "colorPalette.plain.bg.hover",
        },
        _on: {
          bg: "colorPalette.plain.bg.active",
        },
        color: "colorPalette.plain.fg",
      },
      solid: {
        _hover: {
          bg: "colorPalette.solid.bg.hover",
        },
        bg: "colorPalette.solid.bg",
        color: "colorPalette.solid.fg",
      },
      subtle: {
        _active: {
          bg: "colorPalette.subtle.bg.active",
        },
        _hover: {
          bg: "colorPalette.subtle.bg.hover",
        },
        _on: {
          bg: "colorPalette.subtle.bg.active",
        },
        bg: "colorPalette.subtle.bg",
        color: "colorPalette.subtle.fg",
      },
      surface: {
        _active: {
          bg: "colorPalette.surface.bg.active",
        },
        _hover: {
          borderColor: "colorPalette.surface.border.hover",
        },
        _on: {
          bg: "colorPalette.surface.bg.active",
        },
        bg: "colorPalette.surface.bg",
        borderColor: "colorPalette.surface.border",
        borderWidth: "1px",
        color: "colorPalette.surface.fg",
      },
    },
  },
});
