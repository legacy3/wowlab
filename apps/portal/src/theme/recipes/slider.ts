import { sliderAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const slider = defineSlotRecipe({
  base: {
    control: {
      alignItems: "center",
      display: "inline-flex",
    },
    label: {
      fontWeight: "medium",
      textStyle: "sm",
    },
    marker: {
      alignItems: "center",
      color: "fg.muted",
      display: "flex",
      gap: "calc(var(--slider-thumb-size) / 2)",
      textStyle: "xs",
    },
    markerGroup: {
      position: "absolute!",
      zIndex: "1",
    },
    markerIndicator: {
      bg: "colorPalette.solid.fg",
      borderRadius: "full",
      height: "var(--slider-marker-size)",
      width: "var(--slider-marker-size)",
    },
    range: {
      height: "inherit",
      width: "inherit",
    },
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1",
      isolation: "isolate",
      position: "relative",
      textStyle: "sm",
      touchAction: "none",
      width: "full",
    },
    thumb: {
      _focusVisible: {
        ring: "2px",
        ringColor: "colorPalette.solid",
        ringOffset: "2px",
        ringOffsetColor: "bg",
      },
      alignItems: "center",
      borderRadius: "full",
      display: "flex",
      height: "var(--slider-thumb-size)",
      justifyContent: "center",
      outline: 0,
      width: "var(--slider-thumb-size)",
      zIndex: "2",
    },
    track: {
      borderRadius: "full",
      flex: "1",
      overflow: "hidden",
    },
  },
  className: "slider",
  defaultVariants: {
    orientation: "horizontal",
    size: "md",
    variant: "outline",
  },
  slots: sliderAnatomy.extendWith("markerIndicator").keys(),
  variants: {
    orientation: {
      horizontal: {
        control: {
          "&[data-has-mark-label]": {
            marginBottom: "4",
          },
          flexDirection: "row",
          minHeight: "var(--slider-thumb-size)",
          width: "100%",
        },
        marker: {
          flexDirection: "column",
        },
        markerGroup: {
          insetInline: "var(--slider-marker-inset)",
          top: "var(--slider-marker-center)",
        },
        thumb: {
          top: "50%",
          translate: "0 -50%",
        },
        track: {
          height: "var(--slider-track-size)",
        },
      },
      vertical: {
        control: {
          "&[data-has-mark-label]": {
            marginEnd: "4",
          },
          flexDirection: "column",
          height: "100%",
          minWidth: "var(--slider-thumb-size)",
        },
        marker: {
          flexDirection: "row",
        },
        markerGroup: {
          insetBlock: "var(--slider-marker-inset)",
          insetStart: "var(--slider-marker-center)",
        },
        root: {
          display: "inline-flex",
        },
        thumb: {
          left: "50%",
          translate: "-50% 0",
        },
        track: {
          width: "var(--slider-track-size)",
        },
      },
    },
    size: {
      lg: {
        root: {
          "--slider-marker-center": "8px",
          "--slider-marker-inset": "4px",
          "--slider-marker-size": "sizes.1",
          "--slider-thumb-size": "sizes.5",
          "--slider-track-size": "sizes.2",
        },
      },
      md: {
        root: {
          "--slider-marker-center": "8px",
          "--slider-marker-inset": "4px",
          "--slider-marker-size": "sizes.1",
          "--slider-thumb-size": "sizes.5",
          "--slider-track-size": "sizes.2",
        },
      },
      sm: {
        root: {
          "--slider-marker-center": "8px",
          "--slider-marker-inset": "4px",
          "--slider-marker-size": "sizes.1",
          "--slider-thumb-size": "sizes.5",
          "--slider-track-size": "sizes.2",
        },
      },
    },
    variant: {
      outline: {
        range: {
          bg: "colorPalette.solid.bg",
        },
        thumb: {
          bg: "gray.surface.bg",
          borderColor: "colorPalette.solid.bg",
          borderWidth: "2px",
          boxShadow: "xs",
        },
        track: {
          bg: "border",
        },
      },
    },
  },
});
