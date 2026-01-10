import { defineAnimationStyles } from "@pandacss/dev";

export const animationStyles = defineAnimationStyles({
  "scale-fade-in": {
    value: {
      animationName: "scale-in, fade-in",
      transformOrigin: "var(--transform-origin)",
    },
  },
  "scale-fade-out": {
    value: {
      animationName: "scale-out, fade-out",
      transformOrigin: "var(--transform-origin)",
    },
  },
  "slide-fade-in": {
    value: {
      "&[data-placement^=bottom]": {
        animationName: "slide-from-top, fade-in",
      },
      "&[data-placement^=left]": {
        animationName: "slide-from-right, fade-in",
      },
      "&[data-placement^=right]": {
        animationName: "slide-from-left, fade-in",
      },
      "&[data-placement^=top]": {
        animationName: "slide-from-bottom, fade-in",
      },
      transformOrigin: "var(--transform-origin)",
    },
  },
  "slide-fade-out": {
    value: {
      "&[data-placement^=bottom]": {
        animationName: "slide-to-top, fade-out",
      },
      "&[data-placement^=left]": {
        animationName: "slide-to-right, fade-out",
      },
      "&[data-placement^=right]": {
        animationName: "slide-to-left, fade-out",
      },
      "&[data-placement^=top]": {
        animationName: "slide-to-bottom, fade-out",
      },
      transformOrigin: "var(--transform-origin)",
    },
  },
});
