import { switchAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const switchRecipe = defineSlotRecipe({
  base: {
    control: {
      _disabled: {
        layerStyle: "disabled",
      },
      _invalid: {
        outline: "2px solid",
        outlineColor: "error",
        outlineOffset: "2px",
      },
      borderRadius: "full",
      cursor: "pointer",
      display: "inline-flex",
      flexShrink: 0,
      focusVisibleRing: "outside",
      gap: "0.5rem",
      height: "var(--switch-height)",
      justifyContent: "flex-start",
      position: "relative",
      transition: "backgrounds",
      width: "var(--switch-width)",
    },
    indicator: {
      _checked: {
        insetInlineStart: "2px",
      },
      display: "grid",
      flexShrink: 0,
      fontSize: "var(--switch-indicator-font-size)",
      fontWeight: "medium",
      height: "var(--switch-height)",
      insetInlineStart: "calc(var(--switch-x) - 2px)",
      placeContent: "center",
      position: "absolute",
      transition: "inset-inline-start 0.12s ease",
      userSelect: "none",
      width: "var(--switch-height)",
    },
    label: {
      fontWeight: "medium",
      lineHeight: "1",
      userSelect: "none",
    },
    root: {
      "--switch-diff": "calc(var(--switch-width) - var(--switch-height))",
      "--switch-x": {
        _rtl: "calc(var(--switch-diff) * -1)",
        base: "var(--switch-diff)",
      },
      alignItems: "center",
      display: "inline-flex",
      position: "relative",
      verticalAlign: "middle",
    },
    thumb: {
      _checked: {
        translate: "var(--switch-x) 0",
      },
      alignItems: "center",
      borderRadius: "inherit",
      display: "flex",
      flexShrink: 0,
      justifyContent: "center",
      transitionDuration: "fast",
      transitionProperty: "translate",
    },
  },
  className: "switchRecipe",
  defaultVariants: {
    size: "md",
    variant: "solid",
  },
  jsx: ["Switch", /Switch\.+/],
  slots: switchAnatomy.extendWith("indicator").keys(),
  variants: {
    size: {
      lg: {
        label: { fontSize: "lg" },
        root: {
          "--switch-height": "sizes.5.5",
          "--switch-indicator-font-size": "fontSizes.md",
          "--switch-width": "sizes.11",
          gap: "3",
        },
      },
      md: {
        label: { fontSize: "md" },
        root: {
          "--switch-height": "sizes.5",
          "--switch-indicator-font-size": "fontSizes.sm",
          "--switch-width": "sizes.10",
          gap: "3",
        },
      },
      sm: {
        label: { fontSize: "sm" },
        root: {
          "--switch-height": "sizes.4.5",
          "--switch-indicator-font-size": "fontSizes.xs",
          "--switch-width": "sizes.9",
          gap: "2",
        },
      },
      xs: {
        label: { fontSize: "sm" },
        root: {
          "--switch-height": "sizes.4",
          "--switch-indicator-font-size": "fontSizes.xs",
          "--switch-width": "sizes.8",
          gap: "2",
        },
      },
    },
    variant: {
      solid: {
        control: {
          _checked: {
            bg: "colorPalette.solid.bg",
          },
          bg: "gray.subtle.bg",
          borderRadius: "full",
          focusVisibleRing: "outside",
        },
        thumb: {
          _checked: {
            bg: "colorPalette.solid.fg",
          },
          bg: "white",
          boxShadow: "xs",
          height: "var(--switch-height)",
          scale: "0.8",
          width: "var(--switch-height)",
        },
      },
    },
  },
});
