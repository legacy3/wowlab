import { defineRecipe } from "@pandacss/dev";

export const secretValue = defineRecipe({
  base: {
    alignItems: "center",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "code",
    gap: "1.5",
    userSelect: "none",
  },
  className: "secretValue",
  defaultVariants: {
    size: "md",
    variant: "plain",
  },
  variants: {
    size: {
      lg: { textStyle: "md" },
      md: { textStyle: "sm" },
      sm: { textStyle: "xs" },
    },
    variant: {
      field: {
        bg: "bg.muted",
        borderColor: "border.default",
        borderRadius: "l2",
        borderWidth: "1px",
        color: "fg.muted",
        px: "3",
        py: "2",
        width: "full",
      },
      plain: {
        _hover: {
          bg: "bg.muted",
        },
        borderRadius: "sm",
        color: "fg.default",
        mx: "-0.5",
        px: "0.5",
      },
    },
  },
});
