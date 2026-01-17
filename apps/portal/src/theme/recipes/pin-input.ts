import { pinInputAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

import { input } from "./input";

export const pinInput = defineSlotRecipe({
  base: {
    control: {
      display: "inline-flex",
      gap: "2",
      isolation: "isolate",
    },
    input: {
      ...input.base,
      px: "1!",
      textAlign: "center",
      width: "var(--input-height)",
    },
  },
  className: "pin-input",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  slots: pinInputAnatomy.keys(),

  variants: {
    attached: {
      true: {
        control: {
          gap: "0",
        },
        input: {
          _first: {
            borderEndRadius: "0",
          },
          _last: {
            borderStartRadius: "0",
          },
          _notFirst: {
            _notLast: {
              borderRadius: "0",
            },
          },
          // Remove double borders
          "&:not(:first-child)": {
            marginInlineStart: "-1px",
          },
        },
      },
    },
    size: {
      "2xl": {
        input: input.variants?.size?.["2xl"],
      },
      lg: {
        input: input.variants?.size?.lg,
      },
      md: {
        input: input.variants?.size?.md,
      },
      sm: {
        input: input.variants?.size?.sm,
      },
      xl: {
        input: input.variants?.size?.xl,
      },
      xs: {
        input: input.variants?.size?.xs,
      },
    },
    variant: {
      flushed: { input: input.variants?.variant?.flushed },
      outline: { input: input.variants?.variant?.outline },
      subtle: { input: input.variants?.variant?.subtle },
      surface: { input: input.variants?.variant?.surface },
    },
  },
});
