import { hoverCardAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const hoverCard = defineSlotRecipe({
  base: {
    arrow: {
      "--arrow-background": "var(--hovercard-bg)",
      "--arrow-size": "sizes.3",
    },
    arrowTip: {
      borderInlineStartWidth: "0.5px",
      borderTopWidth: "0.5px",
    },
    content: {
      _closed: {
        animationDuration: "faster",
        animationStyle: "slide-fade-out",
      },

      _open: {
        animationDuration: "fast",
        animationStyle: "slide-fade-in",
      },
      "--hovercard-bg": "colors.gray.surface.bg",
      bg: "var(--hovercard-bg)",
      borderRadius: "l3",
      boxShadow: "lg",
      display: "flex",
      flexDirection: "column",
      maxWidth: "80",
      outline: "0",
      padding: "4",
      position: "relative",
      textStyle: "sm",
      transformOrigin: "var(--transform-origin)",
      zIndex: "popover",
    },
  },
  className: "hover-card",
  slots: hoverCardAnatomy.keys(),
});
