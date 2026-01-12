import { numberInputAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

import { input } from "./input";

const trigger = {
  _active: {
    bg: "gray.surface.bg.active",
  },
  _hover: {
    bg: "gray.surface.bg.hover",
  },
  _icon: {
    boxSize: "1em",
  },
  alignItems: "center",
  color: "fg.muted",
  cursor: "pointer",
  display: "flex",
  flex: "1",
  justifyContent: "center",
  lineHeight: "1",
  transition: "common",
  userSelect: "none",
};

export const numberInput = defineSlotRecipe({
  base: {
    control: {
      borderStartWidth: "1px",
      display: "flex",
      divideY: "1px",
      flexDirection: "column",
      height: "calc(100% - 2px)",
      insetEnd: "0px",
      margin: "1px",
      position: "absolute",
      top: "0",
      width: "var(--stepper-width)",
      zIndex: "1",
    },
    decrementTrigger: {
      ...trigger,
      borderBottomRightRadius: "l2",
    },
    incrementTrigger: {
      ...trigger,
      borderTopRightRadius: "l2",
    },
    input: {
      ...input.base,
      pe: "calc(var(--stepper-width) + 0.5rem)",
      verticalAlign: "top",
    },
    label: {
      color: "fg.default",
      fontWeight: "medium",
    },
    root: {
      _disabled: {
        layerStyle: "disabled",
      },
      isolation: "isolate",
      position: "relative",
    },
  },
  className: "number-input",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  slots: numberInputAnatomy.keys(),
  variants: {
    size: {
      lg: {
        control: {
          "--stepper-width": "sizes.5.5",
        },
        input: input.variants.size.lg,
      },
      md: {
        control: {
          "--stepper-width": "sizes.5",
        },
        input: input.variants.size.md,
      },
      sm: {
        control: {
          "--stepper-width": "sizes.4.5",
        },
        input: input.variants.size.sm,
      },
      xl: {
        control: {
          "--stepper-width": "sizes.6",
        },
        input: input.variants.size.xl,
      },
    },
    variant: {
      outline: {
        input: input.variants.variant.outline,
      },
      surface: {
        input: input.variants.variant.surface,
      },
    },
  },
});
