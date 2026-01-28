import { defineRecipe } from "@pandacss/dev";

export const absoluteCenter = defineRecipe({
  base: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    position: "absolute",
  },
  className: "absolute-center",
  defaultVariants: {
    axis: "both",
  },
  variants: {
    axis: {
      both: {
        _rtl: {
          translate: "50% -50%",
        },
        insetStart: "50%",
        top: "50%",
        translate: "-50% -50%",
      },
      horizontal: {
        _rtl: {
          translate: "50%",
        },
        insetStart: "50%",
        translate: "-50%",
      },
      vertical: {
        top: "50%",
        translate: "0 -50%",
      },
    },
  },
});
