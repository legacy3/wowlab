import { dialogAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const drawer = defineSlotRecipe({
  base: {
    backdrop: {
      _closed: {
        animationDuration: "normal",
        animationName: "fade-out",
        animationTimingFunction: "emphasized-out",
      },
      _open: {
        animationDuration: "slow",
        animationName: "fade-in",
        animationTimingFunction: "emphasized-in",
      },
      background: "black.a7",
      height: "100dvh",
      insetInlineStart: "0",
      position: "fixed",
      top: "0",
      width: "100vw",
      zIndex: "overlay",
    },
    body: {
      alignItems: "flex-start",
      display: "flex",
      flex: "1",
      flexDirection: "column",
      overflow: "auto",
      p: { base: "4", md: "6" },
    },
    closeTrigger: {
      insetEnd: "3",
      pos: "absolute",
      top: "3",
    },
    content: {
      _closed: {
        animationDuration: "normal",
        animationTimingFunction: "cubic-bezier(0.3, 0.0, 0.8, 0.15)",
      },
      _open: {
        animationDuration: "slowest",
        animationTimingFunction: "cubic-bezier(0.05, 0.7, 0.1, 1.0)",
      },
      bg: "gray.surface.bg",
      boxShadow: "lg",
      color: "inherit",
      display: "flex",
      flexDirection: "column",
      maxH: "100dvh",
      outline: 0,
      position: "relative",
      width: "100%",
      zIndex: "modal",
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
      py: "4",
    },
    header: {
      display: "flex",
      flex: "0",
      flexDirection: "column",
      gap: "1",
      pb: "4",
      pt: { base: "4", md: "6" },
      px: { base: "4", md: "6" },
    },
    positioner: {
      display: "flex",
      height: "100dvh",
      insetInlineStart: "0",
      overscrollBehaviorY: "none",
      position: "fixed",
      top: "0",
      width: "100vw",
      zIndex: "modal",
    },
    title: {
      color: "fg.default",
      fontWeight: "semibold",
      textStyle: "xl",
    },
  },
  className: "drawer",
  defaultVariants: {
    placement: "end",
    size: "sm",
  },
  slots: dialogAnatomy.extendWith("header", "body", "footer").keys(),
  variants: {
    placement: {
      bottom: {
        content: {
          _closed: { animationName: "slide-to-bottom-full, fade-out" },
          _open: { animationName: "slide-from-bottom-full, fade-in" },
          maxW: "100%",
        },
        positioner: {
          alignItems: "flex-end",
          justifyContent: "stretch",
        },
      },
      end: {
        content: {
          _closed: {
            animationName: {
              _rtl: "slide-to-left-full, fade-out",
              base: "slide-to-right-full, fade-out",
            },
          },
          _open: {
            animationName: {
              _rtl: "slide-from-left-full, fade-in",
              base: "slide-from-right-full, fade-in",
            },
          },
        },
        positioner: {
          alignItems: "stretch",
          justifyContent: "flex-end",
        },
      },
      start: {
        content: {
          _closed: {
            animationName: {
              _rtl: "slide-to-right-full, fade-out",
              base: "slide-to-left-full, fade-out",
            },
          },
          _open: {
            animationName: {
              _rtl: "slide-from-right-full, fade-in",
              base: "slide-from-left-full, fade-in",
            },
          },
        },
        positioner: {
          alignItems: "stretch",
          justifyContent: "flex-start",
        },
      },

      top: {
        content: {
          _closed: { animationName: "slide-to-top-full, fade-out" },
          _open: { animationName: "slide-from-top-full, fade-in" },
          maxW: "100%",
        },
        positioner: {
          alignItems: "flex-start",
          justifyContent: "stretch",
        },
      },
    },
    size: {
      full: {
        content: {
          h: "100dvh",
          maxW: "100vw",
        },
      },
      lg: {
        content: {
          maxW: "lg",
        },
      },
      md: {
        content: {
          maxW: "md",
        },
      },
      sm: {
        content: {
          maxW: "sm",
        },
      },
      xl: {
        content: {
          maxW: "xl",
        },
      },
      xs: {
        content: {
          maxW: "xs",
        },
      },
    },
  },
});
