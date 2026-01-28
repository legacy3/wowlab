import { defineRecipe } from "@pandacss/dev";

export const group = defineRecipe({
  base: {
    "& > *": {
      _focusVisible: {
        zIndex: 1,
      },
    },
    display: "inline-flex",
    gap: "2",
    position: "relative",
  },
  className: "group",
  compoundVariants: [
    {
      attached: true,
      css: {
        "& > *:first-child": {
          borderEndRadius: "0",
          marginEnd: "-1px",
        },
        "& > *:last-child": {
          borderStartRadius: "0",
        },
        "& > *:not(:first-child):not(:last-child)": {
          borderRadius: "0",
          marginEnd: "-1px",
        },
      },
      orientation: "horizontal",
    },
    {
      attached: true,
      css: {
        "& > *:first-child": {
          borderBottomRadius: "0",
          marginBottom: "-1px",
        },
        "& > *:last-child": {
          borderTopRadius: "0",
        },
        "& > *:not(:first-child):not(:last-child)": {
          borderRadius: "0",
          marginBottom: "-1px",
        },
      },
      orientation: "vertical",
    },
  ],
  defaultVariants: {
    orientation: "horizontal",
  },
  variants: {
    attached: {
      true: {
        gap: "0",
      },
    },
    grow: {
      true: {
        "& > *": {
          flex: 1,
        },
        display: "flex",
      },
    },
    orientation: {
      horizontal: {
        flexDirection: "row",
      },
      vertical: {
        flexDirection: "column",
      },
    },
  },
});
