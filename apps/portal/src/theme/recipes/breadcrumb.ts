import { defineSlotRecipe } from "@pandacss/dev";

export const breadcrumb = defineSlotRecipe({
  base: {
    ellipsis: {
      _icon: { boxSize: "1em" },
      alignItems: "center",
      color: "fg.muted",
      display: "inline-flex",
      justifyContent: "center",
    },
    item: {
      _last: {
        color: "fg.default",
      },
      alignItems: "center",
      color: "fg.muted",
      display: "inline-flex",
    },
    link: {
      _icon: { boxSize: "1em" },
      alignItems: "center",
      borderRadius: "l1",
      display: "inline-flex",
      focusRing: "outside",
      gap: "2",
      outline: "0",
      textDecoration: "none",
      transition: "color",
    },
    list: {
      alignItems: "center",
      display: "flex",
      listStyle: "none",
      wordBreak: "break-word",
    },
    separator: {
      _icon: { boxSize: "1em" },
      _rtl: { rotate: "180deg" },
      color: "fg.subtle",
    },
  },
  className: "breadcrumb",
  defaultVariants: {
    size: "md",
    variant: "plain",
  },

  slots: ["root", "list", "link", "item", "separator", "ellipsis"],

  variants: {
    size: {
      lg: { list: { gap: "2", textStyle: "lg" } },
      md: { list: { gap: "1.5", textStyle: "md" } },
      sm: { list: { gap: "1", textStyle: "sm" } },
      xs: { list: { gap: "1", textStyle: "xs" } },
    },
    variant: {
      plain: {
        link: {
          _currentPage: { color: "fg.default" },
          _hover: { color: "fg.default" },
          color: "fg.muted",
        },
      },
      underline: {
        link: {
          _hover: { textDecorationColor: "fg.default" },
          textDecoration: "underline",
          textDecorationColor: "fg.subtle",
          textDecorationThickness: "0.1em",
          textUnderlineOffset: "0.125em",
        },
      },
    },
  },
});
