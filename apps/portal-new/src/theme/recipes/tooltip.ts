import { tooltipAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const tooltip = defineSlotRecipe({
  base: {
    arrow: {
      "--arrow-background": "var(--tooltip-bg)",
      "--arrow-size": "sizes.2",
    },
    arrowTip: {
      borderColor: "var(--tooltip-bg)",
      borderInlineStartWidth: "1px",
      borderTopWidth: "1px",
    },
    content: {
      _closed: {
        animationDuration: "faster",
        animationStyle: "scale-fade-out",
      },
      _open: {
        animationDuration: "fast",
        animationStyle: "scale-fade-in",
      },
      "--tooltip-bg": "colors.gray.solid.bg",
      bg: "var(--tooltip-bg)",
      borderRadius: "l2",
      boxShadow: "sm",
      color: "gray.solid.fg",
      fontWeight: "semibold",
      maxWidth: "xs",
      px: "2",
      py: "1.5",
      textStyle: "xs",
    },
  },
  className: "tooltip",
  slots: tooltipAnatomy.keys(),
});
