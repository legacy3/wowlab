import { defineRecipe } from "@pandacss/dev";

export const prose = defineRecipe({
  base: {
    "& > :first-child": {
      mt: 0,
    },
    "& > :last-child": {
      mb: 0,
    },
    "& a": {
      _hover: {
        color: "colorPalette.text/80",
      },
      color: "colorPalette.text",
      textDecoration: "underline",
      textUnderlineOffset: "2px",
    },
    "& blockquote": {
      borderColor: "border.default",
      borderLeftWidth: "2px",
      color: "fg.muted",
      fontStyle: "italic",
      my: 6,
      pl: 4,
    },
    "& code": {
      bg: "bg.muted",
      borderRadius: "sm",
      fontSize: "0.875em",
      px: 1.5,
      py: 0.5,
    },
    "& h2": {
      borderBottomWidth: "1px",
      borderColor: "border.default",
      fontSize: "2xl",
      fontWeight: "semibold",
      letterSpacing: "tight",
      mb: 4,
      mt: 12,
      pb: 2,
    },
    "& h3": {
      fontSize: "xl",
      fontWeight: "semibold",
      mb: 3,
      mt: 8,
    },
    "& h4": {
      fontSize: "lg",
      fontWeight: "semibold",
      mb: 2,
      mt: 6,
    },
    "& hr": {
      borderColor: "border.default",
      my: 8,
    },
    "& li": {
      my: 1,
    },
    "& li > ul, & li > ol": {
      my: 1,
    },
    "& ol > li": {
      listStyleType: "decimal",
    },
    "& p": {
      my: 4,
    },
    "& p:first-child": {
      mt: 0,
    },
    "& pre": {
      bg: "bg.muted",
      borderRadius: "md",
      my: 6,
      overflowX: "auto",
      p: 4,
    },
    "& pre code": {
      bg: "transparent",
      borderRadius: 0,
      fontSize: "sm",
      p: 0,
    },
    "& strong": {
      fontWeight: "semibold",
    },
    "& table": {
      my: 6,
      w: "full",
    },
    "& ul, & ol": {
      my: 4,
      pl: 6,
    },
    "& ul > li": {
      listStyleType: "disc",
    },
    color: "fg.default",
    lineHeight: "relaxed",
  },
  className: "prose",
  description: "Typography styles for article content",
});
