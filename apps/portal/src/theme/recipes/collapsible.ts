import { collapsibleAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const collapsible = defineSlotRecipe({
  base: {
    content: {
      _closed: {
        animationDuration: "normal",
        animationName: "collapse-height, fade-out",
      },
      _open: {
        animationDuration: "slow",
        animationName: "expand-height, fade-in",
      },
      overflow: "hidden",
    },
    indicator: {
      _open: {
        transform: "rotate(90deg)",
      },
      display: "inline-flex",
      transition: "transform",
      transitionDuration: "fast",
    },
  },
  className: "collapsible",
  slots: collapsibleAnatomy.keys(),
});
