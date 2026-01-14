import { dialogAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const dialog = defineSlotRecipe({
  base: {
    backdrop: {
      _closed: {
        animationDuration: "fast",
        animationName: "fade-out",
        animationTimingFunction: "emphasized-out",
      },
      _open: {
        animationDuration: "normal",
        animationName: "fade-in",
        animationTimingFunction: "emphasized-in",
      },
      background: "black.a7",
      height: "100dvh",
      left: "0",
      position: "fixed",
      top: "0",
      width: "100dvw",
      zIndex: "var(--z-index)",
    },
    body: {
      alignItems: "flex-start",
      display: "flex",
      flex: "1",
      flexDirection: "column",
      px: { base: "4", md: "6" },
    },

    closeTrigger: {
      insetEnd: "3",
      pos: "absolute",
      top: "3",
    },
    content: {
      _closed: {
        animationDuration: "normal",
      },
      _open: {
        animationDuration: "slowest",
      },
      "--dialog-z-index": "zIndex.modal",
      bg: "gray.surface.bg",
      borderRadius: "l3",
      boxShadow: "lg",
      display: "flex",
      flexDirection: "column",
      gap: { base: "4", md: "6" },
      my: "var(--dialog-margin, var(--dialog-base-margin))",
      outline: 0,
      position: "relative",
      py: { base: "4", md: "6" },
      textStyle: "sm",
      width: "100%",
      zIndex: "calc(var(--dialog-z-index) + var(--layer-index, 0))",
    },
    description: {
      color: "fg.muted",
      textStyle: "sm",
    },
    footer: {
      alignItems: "center",
      display: "flex",
      flex: "0",
      gap: "3",
      justifyContent: "flex-end",
      px: { base: "4", md: "6" },
    },
    header: {
      display: "flex",
      flex: "0",
      flexDirection: "column",
      gap: "0.5",
      px: { base: "4", md: "6" },
    },
    positioner: {
      "--dialog-z-index": "zIndex.modal",
      display: "flex",
      height: "100dvh",
      justifyContent: "center",
      left: 0,
      overscrollBehaviorY: "none",
      position: "fixed",
      top: 0,
      width: "100dvw",
      zIndex: "calc(var(--dialog-z-index) + var(--layer-index, 0))",
    },
    title: {
      fontWeight: "semibold",
      textStyle: "lg",
    },
  },
  className: "dialog",
  defaultVariants: {
    motionPreset: "scale",
    placement: "center",
    scrollBehavior: "outside",
    size: "md",
  },
  slots: dialogAnatomy.extendWith("header", "body", "footer").keys(),
  variants: {
    motionPreset: {
      none: {},
      scale: {
        content: {
          _closed: { animationName: "scale-out, fade-out" },
          _open: { animationName: "scale-in, fade-in" },
        },
      },
      "slide-in-bottom": {
        content: {
          _closed: { animationName: "slide-to-bottom, fade-out" },
          _open: { animationName: "slide-from-bottom, fade-in" },
        },
      },
      "slide-in-left": {
        content: {
          _closed: { animationName: "slide-to-left, fade-out" },
          _open: { animationName: "slide-from-left, fade-in" },
        },
      },
      "slide-in-right": {
        content: {
          _closed: { animationName: "slide-to-right, fade-out" },
          _open: { animationName: "slide-from-right, fade-in" },
        },
      },
      "slide-in-top": {
        content: {
          _closed: { animationName: "slide-to-top, fade-out" },
          _open: { animationName: "slide-from-top, fade-in" },
        },
      },
    },
    placement: {
      bottom: {
        content: {
          "--dialog-base-margin": "spacing.16",
          mx: "auto",
        },
        positioner: {
          alignItems: "flex-end",
        },
      },
      center: {
        content: {
          "--dialog-base-margin": "auto",
          mx: "auto",
        },
        positioner: {
          alignItems: "center",
        },
      },
      top: {
        content: {
          "--dialog-base-margin": "spacing.16",
          mx: "auto",
        },
        positioner: {
          alignItems: "flex-start",
        },
      },
    },
    scrollBehavior: {
      inside: {
        body: {
          overflow: "auto",
        },
        content: {
          maxH: "calc(100% - 7.5rem)",
        },
        positioner: {
          overflow: "hidden",
        },
      },
      outside: {
        positioner: {
          overflow: "auto",
          pointerEvents: "auto",
        },
      },
    },
    size: {
      cover: {
        content: {
          "--dialog-margin": "0",
          height: "100%",
          width: "100%",
        },
        positioner: { padding: "8" },
      },
      full: {
        content: {
          "--dialog-margin": "0",
          borderRadius: "0",
          maxW: "100dvw",
          minH: "100dvh",
        },
      },
      lg: { content: { maxW: "lg" } },
      md: { content: { maxW: "md" } },
      sm: { content: { maxW: "sm" } },
      xl: { content: { maxW: "xl" } },
      xs: { content: { maxW: "xs" } },
    },
  },
});
