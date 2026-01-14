import { tabsAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const tabs = defineSlotRecipe({
  base: {
    content: {
      _horizontal: {
        width: "100%",
      },

      _vertical: {
        height: "100%",
      },
      focusVisibleRing: "inside",
    },
    indicator: {
      height: "var(--height)",
      width: "var(--width)",
      zIndex: -1,
    },
    list: {
      _horizontal: {
        flexDirection: "row",
      },
      _vertical: {
        flexDirection: "column",
      },
      display: "flex",
      isolation: "isolate",
      position: "relative",
    },
    root: {
      _horizontal: {
        flexDirection: "column",
        gap: "2",
      },
      _vertical: {
        flexDirection: "row",
        gap: "4",
      },
      alignItems: "start",
      display: "flex",
      position: "relative",
    },
    trigger: {
      _disabled: {
        layerStyle: "disabled",
      },
      _focusVisible: {
        focusVisibleRing: "outside",
        zIndex: 1,
      },
      alignItems: "center",
      cursor: "pointer",
      display: "flex",
      fontWeight: "semibold",
      outline: "0",
      position: "relative",
    },
  },
  className: "tabs",
  defaultVariants: {
    size: "md",
    variant: "line",
  },

  slots: tabsAnatomy.keys(),

  variants: {
    fitted: {
      true: {
        root: {
          alignItems: "stretch",
        },
        trigger: {
          flex: 1,
          justifyContent: "center",
          textAlign: "center",
        },
      },
    },
    size: {
      lg: {
        list: { gap: "1" },
        trigger: { gap: "2", h: "11", minW: "11", px: "4.5", textStyle: "md" },
      },
      md: {
        list: { gap: "1" },
        trigger: { gap: "2", h: "10", minW: "10", px: "4", textStyle: "sm" },
      },
      sm: {
        list: { gap: "1" },
        trigger: { gap: "2", h: "9", minW: "9", px: "3.5", textStyle: "sm" },
      },
      xs: {
        list: { gap: "1" },
        trigger: { gap: "2", h: "8", minW: "8", px: "3", textStyle: "xs" },
      },
    },
    variant: {
      enclosed: {
        indicator: {
          bg: {
            _dark: "gray.2",
            _light: "white",
          },
          borderRadius: "l2",
          boxShadow: {
            _dark: "none",
            _light: "xs",
          },
        },
        list: {
          bg: {
            _dark: "gray.1",
            _light: "gray.2",
          },
          borderRadius: "l3",
          boxShadow: "inset 0 0 0px 1px var(--shadow-color)",
          boxShadowColor: "border",
          p: "1",
        },
        trigger: {
          _selected: {
            color: "colorPalette.surface.fg",
          },
          color: "fg.muted",
        },
      },
      line: {
        indicator: {
          _horizontal: {
            bottom: "0",
            height: "0.5",
            transform: "translateY(1px)",
          },
          _vertical: {
            left: "0",
            transform: "translateX(-1px)",
            width: "0.5",
          },
          background: "colorPalette.solid.bg",
        },
        list: {
          _horizontal: {
            borderBottomWidth: "1px",
          },
          _vertical: {
            borderStartWidth: "1px",
          },
        },
        root: {
          alignItems: "stretch",
        },
        trigger: {
          _selected: {
            color: "colorPalette.plain.fg",
          },
          color: "fg.muted",
        },
      },
      subtle: {
        indicator: {
          bg: "colorPalette.subtle.bg",
          borderRadius: "l2",
          color: "colorPalette.subtle.fg",
        },
        trigger: {
          _selected: {
            color: "colorPalette.subtle.fg",
          },
          color: "fg.muted",
        },
      },
    },
  },
});
