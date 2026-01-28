import { selectAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const select = defineSlotRecipe({
  base: {
    content: {
      _closed: {
        animationDuration: "fastest",
        animationStyle: "slide-fade-out",
      },
      _open: {
        animationDuration: "slow",
        animationStyle: "slide-fade-in",
      },
      background: "gray.surface.bg",
      borderRadius: "l2",
      boxShadow: "md",
      display: "flex",
      flexDirection: "column",
      maxH: "min(var(--available-height), {sizes.96})",
      minWidth: "max(var(--reference-width), {sizes.40})",
      outline: 0,
      overflowY: "auto",
      zIndex: "dropdown",
    },
    indicator: {
      alignItems: "center",
      color: { base: "fg.subtle" },
      display: "flex",
      justifyContent: "center",
    },
    indicatorGroup: {
      alignItems: "center",
      display: "flex",
      gap: "1",
      pointerEvents: "none",
    },
    item: {
      _disabled: {
        layerStyle: "disabled",
      },
      _highlighted: {
        background: "gray.surface.bg.hover",
      },
      _hover: {
        background: "gray.surface.bg.hover",
      },
      _selected: {},
      alignItems: "center",
      borderRadius: "l1",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      userSelect: "none",
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
      color: "colorPalette.plain.fg",
    },
    label: {
      fontWeight: "medium",
      textStyle: "sm",
      userSelect: "none",
    },
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
      width: "full",
    },
    trigger: {
      _disabled: {
        layerStyle: "disabled",
      },
      _placeholderShown: {
        color: "fg.subtle",
      },
      alignItems: "center",
      borderRadius: "l2",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      minWidth: "0",
      outline: "0",
      textAlign: "start",
      transition: "common",
      userSelect: "none",
      width: "full",
    },
    valueText: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  },
  className: "select",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  slots: selectAnatomy.extendWith("indicatorGroup").keys(),
  variants: {
    size: {
      lg: {
        content: { gap: "0.5", p: "1", textStyle: "md" },
        item: { _icon: { boxSize: "4.5" }, gap: "2", minH: "11", px: "2.5" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "11", px: "2.5" },
        trigger: {
          _icon: { boxSize: "4.5" },
          gap: "2",
          h: "11",
          px: "3.5",
          textStyle: "md",
        },
      },
      md: {
        content: { gap: "0.5", p: "1", textStyle: "md" },
        item: { _icon: { boxSize: "4" }, gap: "2", minH: "10", px: "2" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "10", px: "2" },
        trigger: {
          _icon: { boxSize: "4" },
          gap: "2",
          h: "10",
          px: "3",
          textStyle: "md",
        },
      },
      sm: {
        content: { gap: "0.5", p: "1", textStyle: "sm" },
        item: { _icon: { boxSize: "4" }, gap: "2", minH: "9", px: "1.5" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "9", px: "1.5" },
        trigger: {
          _icon: { boxSize: "4" },
          gap: "2",
          h: "9",
          px: "2.5",
          textStyle: "sm",
        },
      },
      xl: {
        content: { gap: "1", p: "1", textStyle: "lg" },
        item: { _icon: { boxSize: "5" }, gap: "3", minH: "12", px: "3" },
        itemGroup: { gap: "1" },
        itemGroupLabel: { height: "12", px: "3" },
        trigger: {
          _icon: { boxSize: "5" },
          gap: "3",
          h: "12",
          px: "4",
          textStyle: "lg",
        },
      },
      xs: {
        content: { gap: "0.5", p: "1", textStyle: "sm" },
        item: { _icon: { boxSize: "3.5" }, gap: "2", minH: "8", px: "1" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "8", px: "1" },
        trigger: {
          _icon: { boxSize: "3.5" },
          gap: "2",
          h: "8",
          px: "2",
          textStyle: "sm",
        },
      },
    },
    variant: {
      outline: {
        trigger: {
          borderColor: "gray.outline.border",
          borderWidth: "1px",

          focusVisibleRing: "inside",
        },
      },
      surface: {
        trigger: {
          bg: "gray.surface.bg",
          borderColor: "gray.surface.border",
          borderWidth: "1px",

          focusVisibleRing: "inside",
        },
      },
    },
  },
});
