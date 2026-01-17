import { defineRecipe } from "@pandacss/dev";

export const chart = defineRecipe({
  base: {
    "--chart-1": "colors.amber.9",
    "--chart-2": "colors.green.9",
    "--chart-3": "colors.blue.9",
    "--chart-4": "colors.red.9",
    "--chart-5": "colors.purple.9",
    "--chart-axis": "colors.fg.muted",
    "--chart-grid": "colors.border.muted",
    "--chart-text": "colors.fg.subtle",
    display: "flex",
    flexDirection: "column",
    gap: "3",
  },
  className: "chart",
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: {
        "& svg": {
          height: "400px",
          width: "100%",
        },
      },
      md: {
        "& svg": {
          height: "300px",
          width: "100%",
        },
      },
      sm: {
        "& svg": {
          height: "200px",
          width: "100%",
        },
      },
    },
  },
});
