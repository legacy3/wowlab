import { defineSlotRecipe } from "@pandacss/dev";

export const card = defineSlotRecipe({
  base: {
    body: {
      display: "flex",
      flex: "1",
      flexDirection: "column",
      pb: "6",
      px: "6",
    },
    description: {
      color: "fg.muted",
      textStyle: "sm",
    },
    footer: {
      display: "flex",
      gap: "3",
      justifyContent: "flex-end",
      pb: "6",
      pt: "2",
      px: "6",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      gap: "1",
      p: "6",
    },
    root: {
      borderRadius: "l3",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    },
    title: {
      fontWeight: "semibold",
      textStyle: "lg",
    },
  },
  className: "card",
  defaultVariants: {
    variant: "outline",
  },
  slots: ["root", "header", "body", "footer", "title", "description"],
  variants: {
    variant: {
      elevated: {
        root: {
          bg: "gray.surface.bg",
          boxShadow: "lg",
        },
      },
      outline: {
        root: {
          bg: "gray.surface.bg",
          borderWidth: "1px",
        },
      },
      subtle: {
        root: {
          bg: "gray.subtle.bg",
        },
      },
    },
  },
});
