import { defineConfig } from "@pandacss/dev";

import { animationStyles } from "@/theme/animation-styles";
import { amber } from "@/theme/colors/amber";
import { green } from "@/theme/colors/green";
import { red } from "@/theme/colors/red";
import { slate } from "@/theme/colors/slate";
import { conditions } from "@/theme/conditions";
import { globalCss } from "@/theme/global-css";
import { keyframes } from "@/theme/keyframes";
import { layerStyles } from "@/theme/layer-styles";
import { recipes, slotRecipes } from "@/theme/recipes";
import { textStyles } from "@/theme/text-styles";
import { colors } from "@/theme/tokens/colors";
import { durations } from "@/theme/tokens/durations";
import { shadows } from "@/theme/tokens/shadows";
import { zIndex } from "@/theme/tokens/z-index";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Match tsconfig paths for styled-system imports
  importMap: "styled-system",

  // Enable JSX components (Box, Stack, etc)
  jsxFramework: "react",

  // Useful for theme customization
  theme: {
    extend: {
      animationStyles: animationStyles,
      keyframes: keyframes,
      layerStyles: layerStyles,
      recipes: recipes,
      semanticTokens: {
        colors: {
          amber: amber,

          border: {
            value: {
              _dark: "{colors.gray.4}",
              _light: "{colors.gray.4}",
            },
          },

          error: {
            value: {
              _dark: "{colors.red.9}",
              _light: "{colors.red.9}",
            },
          },

          fg: {
            default: {
              value: {
                _dark: "{colors.gray.12}",
                _light: "{colors.gray.12}",
              },
            },

            muted: {
              value: {
                _dark: "{colors.gray.11}",
                _light: "{colors.gray.11}",
              },
            },

            subtle: {
              value: {
                _dark: "{colors.gray.10}",
                _light: "{colors.gray.10}",
              },
            },
          },
          gray: slate,
          green: green,
          red: red,
        },

        radii: {
          l1: {
            value: "{radii.xs}",
          },

          l2: {
            value: "{radii.sm}",
          },

          l3: {
            value: "{radii.md}",
          },
        },

        shadows: shadows,
      },
      slotRecipes: slotRecipes,

      textStyles: textStyles,

      tokens: {
        colors: colors,
        durations: durations,
        zIndex: zIndex,
      },
    },
  },

  // The output directory for your css system
  conditions: conditions,

  globalCss: globalCss,
  outdir: "styled-system",
});
