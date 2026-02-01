import { defineRecipe } from "@pandacss/dev";

export const copyButton = defineRecipe({
  base: {
    _disabled: {
      layerStyle: "disabled",
    },
    alignItems: "center",
    appearance: "none",
    borderRadius: "l2",
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: "0",
    focusVisibleRing: "outside",
    gap: "2",
    justifyContent: "center",
    outline: "0",
    position: "relative",
    transition: "colors",
    transitionProperty: "background-color, border-color, color",
    userSelect: "none",
  },
  className: "copyButton",
  defaultVariants: {
    size: "sm",
    variant: "outline",
  },
  jsx: ["CopyButton"],
  variants: {
    size: {
      md: {
        "& svg": { height: "4", width: "4" },
        h: "9",
        minW: "9",
        px: "3",
        textStyle: "sm",
      },
      sm: {
        "& svg": { height: "4", width: "4" },
        h: "8",
        minW: "8",
        px: "2",
        textStyle: "sm",
      },
      xs: {
        "& svg": { height: "3", width: "3" },
        h: "6",
        minW: "6",
        px: "1.5",
        textStyle: "xs",
      },
    },
    variant: {
      outline: {
        _hover: {
          bg: "bg.muted",
          color: "fg.default",
        },
        borderColor: "border.default",
        borderWidth: "1px",
        color: "fg.muted",
      },
      plain: {
        _hover: {
          bg: "bg.muted",
          color: "fg.default",
        },
        color: "fg.muted",
      },
      subtle: {
        _hover: {
          bg: "bg.muted",
          color: "fg.default",
        },
        bg: "bg.subtle",
        color: "fg.muted",
      },
    },
  },
});
