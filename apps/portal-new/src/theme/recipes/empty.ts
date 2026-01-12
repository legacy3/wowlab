import { defineSlotRecipe } from "@pandacss/dev";

export const empty = defineSlotRecipe({
  base: {
    action: {
      mt: "1",
    },
    content: {
      display: "flex",
      flexDirection: "column",
      gap: "1",
    },
    description: {
      color: "fg.subtle",
    },
    icon: {
      color: "fg.muted",
      opacity: 0.5,
    },
    root: {
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      gap: "3",
      justifyContent: "center",
      textAlign: "center",
    },
    title: {
      color: "fg.muted",
      fontWeight: "medium",
    },
  },
  className: "empty",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  slots: ["root", "icon", "content", "title", "description", "action"],
  variants: {
    size: {
      lg: {
        description: { textStyle: "base" },
        icon: { "& svg": { height: "14", width: "14" } },
        root: { py: "16" },
        title: { textStyle: "lg" },
      },
      md: {
        description: { textStyle: "sm" },
        icon: { "& svg": { height: "12", width: "12" } },
        root: { py: "12" },
        title: { textStyle: "base" },
      },
      sm: {
        description: { textStyle: "xs" },
        icon: { "& svg": { height: "8", width: "8" } },
        root: { py: "6" },
        title: { textStyle: "sm" },
      },
    },
    variant: {
      outline: {
        root: {
          borderColor: "border.default",
          borderRadius: "l3",
          borderStyle: "dashed",
          borderWidth: "1px",
        },
      },
      plain: {
        root: {},
      },
      subtle: {
        root: {
          bg: "gray.subtle.bg",
          borderRadius: "l3",
        },
      },
    },
  },
});
