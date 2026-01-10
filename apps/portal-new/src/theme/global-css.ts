export const globalCss = {
  extend: {
    "*": {
      "--global-color-border": "colors.border",
      "--global-color-focus-ring": "colors.colorPalette.solid.bg",
      "--global-color-placeholder": "colors.fg.subtle",
      "--global-color-selection": "colors.colorPalette.subtle.bg",
    },
    body: {
      background: "canvas",
      color: "fg.default",
    },
    html: {
      colorPalette: "gray",
    },
  },
};
