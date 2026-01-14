import { defineSlotRecipe } from "@pandacss/dev";

export const alert = defineSlotRecipe({
  base: {
    content: {
      display: "flex",
      flex: "1",
      flexDirection: "column",
      gap: "1",
    },
    description: {
      display: "inline",
    },
    indicator: {
      alignItems: "center",
      display: "inline-flex",
      flexShrink: "0",
      justifyContent: "center",
    },
    root: {
      alignItems: "flex-start",
      borderRadius: "l3",
      display: "flex",
      position: "relative",
      width: "full",
    },
    title: {
      fontWeight: "semibold",
    },
  },
  className: "alert",
  defaultVariants: {
    size: "md",
    status: "info",
    variant: "subtle",
  },
  slots: ["root", "content", "description", "indicator", "title"],
  variants: {
    size: {
      lg: {
        indicator: {
          _icon: {
            height: "6",
            width: "6",
          },
        },
        root: {
          gap: "4",
          p: "4",
          textStyle: "md",
        },
      },
      md: {
        indicator: {
          _icon: {
            height: "5",
            width: "5",
          },
        },
        root: {
          gap: "3",
          p: "4",
          textStyle: "sm",
        },
      },
    },
    status: {
      error: {
        root: { colorPalette: "red" },
      },
      info: {
        root: { colorPalette: "blue" },
      },
      neutral: {},
      success: {
        root: { colorPalette: "green" },
      },
      warning: {
        root: { colorPalette: "orange" },
      },
    },
    variant: {
      outline: {
        root: {
          borderColor: "colorPalette.outline.border",
          borderWidth: "1px",
          color: "colorPalette.outline.fg",
        },
      },
      solid: {
        root: {
          bg: "colorPalette.solid.bg",
          color: "colorPalette.solid.fg",
        },
      },
      subtle: {
        root: {
          bg: "colorPalette.subtle.bg",
          color: "colorPalette.subtle.fg",
        },
      },
      surface: {
        root: {
          bg: "colorPalette.surface.bg",
          borderColor: "colorPalette.surface.border",
          borderWidth: "1px",
          color: "colorPalette.surface.fg",
        },
      },
    },
  },
});
