import { menuAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const menu = defineSlotRecipe({
  base: {
    content: {
      _closed: {
        animationDuration: "faster",
        animationStyle: "slide-fade-out",
      },

      _open: {
        animationDuration: "fast",
        animationStyle: "slide-fade-in",
      },
      "--menu-z-index": "zIndex.dropdown",
      bg: "gray.surface.bg",
      borderRadius: "l3",
      boxShadow: "md",
      display: "flex",
      flexDirection: "column",
      maxH: "min(var(--available-height), {sizes.96})",
      minWidth: "max(var(--reference-width), {sizes.40})",
      outline: "0",
      overflow: "hidden",
      overflowY: "auto",
      position: "relative",
      zIndex: "calc(var(--menu-z-index) + var(--layer-index, 0))",
    },
    item: {
      _disabled: {
        layerStyle: "disabled",
      },
      _highlighted: {
        bg: "gray.surface.bg.hover",
      },
      alignItems: "center",
      borderRadius: "l2",
      display: "flex",
      flex: "0 0 auto",
      outline: "0",
      textAlign: "start",
      textDecoration: "none",
      userSelect: "none",
      width: "100%",
    },
    itemGroupLabel: {
      _after: {
        bg: "border",
        content: '""',
        height: "1px",
        width: "100%",
      },
      alignItems: "flex-start",
      color: "fg.subtle",
      display: "flex",
      flexDirection: "column",
      fontWeight: "medium",
      gap: "1px",
      justifyContent: "center",
    },
    itemIndicator: {
      _checked: {
        _icon: {
          color: "colorPalette.plain.fg",
        },
      },
      display: "flex",
      flex: "1",
      justifyContent: "flex-end",
    },
    trigger: {
      _focusVisible: {
        focusVisibleRing: "outside",
      },
    },
  },
  className: "menu",
  defaultVariants: {
    size: "md",
  },
  slots: menuAnatomy.keys(),

  variants: {
    size: {
      lg: {
        content: { gap: "0.5", p: "1", textStyle: "md" },
        item: { _icon: { boxSize: "4.5" }, gap: "2", minH: "11", px: "2.5" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "11", px: "2.5" },
        separator: { mx: "-2.5", my: "0.5" },
      },
      md: {
        content: { gap: "0.5", p: "1", textStyle: "md" },
        item: { _icon: { boxSize: "4" }, gap: "2", minH: "10", px: "2" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "10", px: "2" },
        separator: { mx: "-2", my: "0.5" },
      },
      sm: {
        content: { gap: "0.5", p: "1", textStyle: "sm" },
        item: { _icon: { boxSize: "4" }, gap: "2", minH: "9", px: "1.5" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "9", px: "1.5" },
        separator: { mx: "-1.5", my: "0.5" },
      },
      xl: {
        content: { gap: "1", p: "1", textStyle: "lg" },
        item: { _icon: { boxSize: "5" }, gap: "3", minH: "12", px: "3" },
        itemGroup: { gap: "1" },
        itemGroupLabel: { height: "12", px: "3" },
        separator: { mx: "-3", my: "0" },
      },
      xs: {
        content: { gap: "0.5", p: "1", textStyle: "sm" },
        item: { _icon: { boxSize: "3.5" }, gap: "2", minH: "8", px: "1" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "8", px: "1" },
        separator: { mx: "-1", my: "0.5" },
      },
    },
  },
});
