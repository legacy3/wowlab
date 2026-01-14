import { accordionAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const accordion = defineSlotRecipe({
  base: {
    item: {
      overflowAnchor: "none",
    },
    itemBody: {
      color: "fg.muted",
      pb: "calc(var(--accordion-padding-y) * 2)",
    },
    itemContent: {
      _closed: {
        animationDuration: "normal",
        animationName: "collapse-height, fade-out",
      },
      _open: {
        animationDuration: "normal",
        animationName: "expand-height, fade-in",
      },
      borderRadius: "var(--accordion-radius)",
      overflow: "hidden",
    },
    itemIndicator: {
      _icon: {
        height: "1.2em",
        width: "1.2em",
      },
      _open: {
        rotate: "180deg",
      },
      color: "fg.subtle",
      transformOrigin: "center",
      transition: "rotate 0.2s",
    },
    itemTrigger: {
      _disabled: {
        layerStyle: "disabled",
      },
      _focusVisible: {
        outline: "2px solid",
        outlineColor: "colorPalette.focusRing",
      },
      alignItems: "center",
      borderRadius: "var(--accordion-radius)",
      color: "fg.default",
      cursor: "pointer",
      display: "flex",
      fontWeight: "semibold",
      gap: "3",
      justifyContent: "space-between",
      textAlign: "start",
      textStyle: "lg",
      width: "full",
    },
    root: {
      "--accordion-radius": "radii.l2",
      width: "full",
    },
  },
  className: "accordion",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  slots: accordionAnatomy.extendWith("itemBody").keys(),
  variants: {
    size: {
      md: {
        itemTrigger: {
          py: "var(--accordion-padding-y)",
          textStyle: "md",
        },
        root: {
          "--accordion-padding-x": "spacing.4",
          "--accordion-padding-y": "spacing.2.5",
        },
      },
    },
    variant: {
      outline: {
        item: {
          borderBottomWidth: "1px",
        },
      },
      plain: {},
    },
  },
});
