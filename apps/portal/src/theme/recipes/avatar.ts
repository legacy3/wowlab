import { avatarAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const avatar = defineSlotRecipe({
  base: {
    fallback: {
      borderRadius: "var(--avatar-radius)",
      fontSize: "var(--avatar-font-size)",
      fontWeight: "medium",
      lineHeight: "1",
      textTransform: "uppercase",
    },
    image: {
      borderRadius: "var(--avatar-radius)",
      height: "100%",
      objectFit: "cover",
      width: "100%",
    },
    root: {
      alignItems: "center",
      borderRadius: "var(--avatar-radius)",
      display: "inline-flex",
      flexShrink: "0",
      fontSize: "var(--avatar-font-size)",
      fontWeight: "medium",
      height: "var(--avatar-size)",
      justifyContent: "center",
      position: "relative",
      userSelect: "none",
      verticalAlign: "top",
      width: "var(--avatar-size)",
    },
  },
  className: "avatar",
  defaultVariants: {
    shape: "full",
    size: "md",
    variant: "subtle",
  },
  slots: avatarAnatomy.keys(),
  variants: {
    shape: {
      full: {
        root: { "--avatar-radius": "radii.full" },
      },
      rounded: {
        root: { "--avatar-radius": "radii.l3" },
      },
      square: {},
    },
    size: {
      "2xl": {
        fallback: {
          _icon: { height: "8", width: "8" },
        },
        root: {
          "--avatar-font-size": "fontSizes.xl",
          "--avatar-size": "sizes.16",
        },
      },
      "2xs": {
        fallback: {
          _icon: { height: "3", width: "3" },
        },
        root: {
          "--avatar-font-size": "fontSizes.2xs",
          "--avatar-size": "sizes.6",
        },
      },
      full: {
        root: {
          "--avatar-font-size": "100%",
          "--avatar-size": "100%",
        },
      },
      lg: {
        fallback: {
          _icon: { height: "5.5", width: "5.5" },
        },
        root: {
          "--avatar-font-size": "fontSizes.md",
          "--avatar-size": "sizes.11",
        },
      },
      md: {
        fallback: {
          _icon: { height: "5", width: "5" },
        },
        root: {
          "--avatar-font-size": "fontSizes.md",
          "--avatar-size": "sizes.10",
        },
      },
      sm: {
        fallback: {
          _icon: { height: "4.5", width: "4.5" },
        },
        root: {
          "--avatar-font-size": "fontSizes.sm",
          "--avatar-size": "sizes.9",
        },
      },
      xl: {
        fallback: {
          _icon: { height: "6", width: "6" },
        },
        root: {
          "--avatar-font-size": "fontSizes.lg",
          "--avatar-size": "sizes.12",
        },
      },
      xs: {
        fallback: {
          _icon: { height: "4", width: "4" },
        },
        root: {
          "--avatar-font-size": "fontSizes.xs",
          "--avatar-size": "sizes.8",
        },
      },
    },
    variant: {
      outline: {
        root: {
          borderColor: "colorPalette.outline.border",
          borderWidth: "1px",
          color: "colorPalette.outline.fg",
        },
      },
      solid: {
        root: {
          bg: "colorPalette.solid.bg",
          color: "colorPalette.solid.fg",
        },
      },
      subtle: {
        root: {
          bg: "colorPalette.subtle.bg",
          color: "colorPalette.subtle.fg",
        },
      },
      surface: {
        root: {
          bg: "colorPalette.surface.bg",
          borderColor: "colorPalette.surface.border",
          borderWidth: "1px",
          color: "colorPalette.surface.fg",
        },
      },
    },
  },
});
