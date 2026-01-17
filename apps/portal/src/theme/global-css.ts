export const globalCss = {
  extend: {
    ":root": {
      "--shiki-background": "colors.syntax.bg",
      "--shiki-foreground": "colors.syntax.fg",
      "--shiki-token-comment": "colors.syntax.comment",
      "--shiki-token-constant": "colors.syntax.constant",
      "--shiki-token-function": "colors.syntax.function",
      "--shiki-token-keyword": "colors.syntax.keyword",
      "--shiki-token-link": "colors.syntax.keyword",
      "--shiki-token-parameter": "colors.syntax.punctuation",
      "--shiki-token-punctuation": "colors.syntax.punctuation",
      "--shiki-token-string": "colors.syntax.string",
      "--shiki-token-string-expression": "colors.syntax.string",
    },
    "*": {
      "--global-color-border": "colors.border",
      "--global-color-focus-ring": "colors.colorPalette.solid.bg",
      "--global-color-placeholder": "colors.fg.subtle",
      "--global-color-selection": "colors.colorPalette.subtle.bg",
    },
    body: {
      background: "canvas",
      color: "fg.default",
      fontFamily: "sans",
    },
    html: {
      colorPalette: "gray",
    },
  },
};
