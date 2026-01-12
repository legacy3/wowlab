import { popoverAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const popover = defineSlotRecipe({
  base: {
    arrow: {
      "--arrow-background": "var(--popover-bg)",
      "--arrow-size": "sizes.3",
    },
    arrowTip: {
      borderInlineStartWidth: "0.5px",
      borderTopWidth: "0.5px",
    },
    body: {
      display: "flex",
      flex: "1",
      flexDirection: "column",
      p: "var(--popover-padding)",
    },
    closeTrigger: {
      position: "absolute",
      right: "1",
      top: "1",
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

      "--popover-bg": "colors.gray.surface.bg",
      "--popover-padding": "spacing.4",
      background: "var(--popover-bg)",
      borderRadius: "l3",
      boxShadow: "lg",
      display: "flex",
      flexDirection: "column",
      maxHeight: "var(--available-height)",
      outline: "0",
      position: "relative",
      textStyle: "sm",
      transformOrigin: "var(--transform-origin)",
      width: "xs",
      zIndex: "calc(var(--z-index-popover) + var(--layer-index, 0))",
    },
    description: {
      color: "fg.muted",
      textStyle: "sm",
    },
    footer: {
      alignItems: "center",
      display: "flex",
      gap: "3",
      justifyContent: "flex-end",
      paddingBottom: "var(--popover-padding)",
      paddingInline: "var(--popover-padding)",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      pt: "var(--popover-padding)",
      px: "var(--popover-padding)",
    },
    title: {
      color: "fg.default",
      fontWeight: "medium",
      textStyle: "md",
    },
  },
  className: "popover",
  slots: popoverAnatomy.extendWith("header", "body", "footer").keys(),
});
