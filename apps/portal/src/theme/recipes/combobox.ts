import { comboboxAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

import { input } from "./input";

export const combobox = defineSlotRecipe({
  base: {
    clearTrigger: {
      color: "fg.muted",
    },
    content: {
      _closed: {
        animationDuration: "fastest",
        animationStyle: "slide-fade-out",
      },
      _open: {
        animationDuration: "slow",
        animationStyle: "slide-fade-in",
      },
      "&[data-empty]:not(:has([data-scope=combobox][data-part=empty]))": {
        opacity: 0,
      },
      background: "gray.surface.bg",
      borderRadius: "l2",
      boxShadow: "md",
      display: "flex",
      flexDirection: "column",
      maxH: "min(var(--available-height), {sizes.96})",
      minWidth: "max(var(--reference-width), {sizes.40})",
      outline: "0",
      overflowY: "auto",
      zIndex: "dropdown",
    },
    control: {
      position: "relative",
    },
    empty: {
      alignItems: "center",
      color: "fg.subtle",
      display: "flex",
    },
    indicatorGroup: {
      alignItems: "center",
      bottom: "0",
      display: "flex",
      gap: "1",
      insetEnd: "0",
      justifyContent: "center",
      pos: "absolute",
      top: "0",
    },
    input: {
      ...input.base,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
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
    },
    itemGroup: {
      display: "flex",
      flexDirection: "column",
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
      textStyle: "label",
    },
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
      width: "full",
    },
    trigger: {
      color: "fg.subtle",
    },
  },
  className: "combobox",
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  slots: comboboxAnatomy.extendWith("indicatorGroup").keys(),
  variants: {
    size: {
      lg: {
        content: { gap: "0.5", p: "1", textStyle: "md" },
        empty: { minH: "11", px: "2.5" },
        indicatorGroup: { _icon: { boxSize: "4.5" }, px: "3.5" },
        input: {
          ...input.variants.size.lg,
          pe: "16",
        },
        item: { _icon: { boxSize: "4.5" }, gap: "2", minH: "11", px: "2.5" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "11", px: "2.5" },
      },
      md: {
        content: { gap: "0.5", p: "1", textStyle: "md" },
        empty: { minH: "10", px: "2" },
        indicatorGroup: { _icon: { boxSize: "4" }, px: "3" },
        input: {
          ...input.variants.size.md,
          pe: "14",
        },
        item: { _icon: { boxSize: "4" }, gap: "2", minH: "10", px: "2" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "10", px: "2" },
      },
      sm: {
        content: { gap: "0.5", p: "1", textStyle: "sm" },
        empty: { minH: "9", px: "1.5" },
        indicatorGroup: { _icon: { boxSize: "4" }, px: "2.5" },
        input: {
          ...input.variants.size.sm,
          pe: "14",
        },
        item: { _icon: { boxSize: "4" }, gap: "2", minH: "9", px: "1.5" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "9", px: "1.5" },
      },
      xl: {
        content: { gap: "1", p: "1", textStyle: "lg" },
        empty: { minH: "12", px: "3" },
        indicatorGroup: { _icon: { boxSize: "5" }, px: "4" },
        input: {
          ...input.variants.size.xl,
          pe: "16",
        },
        item: { _icon: { boxSize: "5" }, gap: "3", minH: "12", px: "3" },
        itemGroup: { gap: "1" },
        itemGroupLabel: { height: "12", px: "3" },
      },
      xs: {
        content: { gap: "0.5", p: "1", textStyle: "sm" },
        empty: { minH: "8", px: "1" },
        indicatorGroup: { _icon: { boxSize: "3.5" }, px: "2" },
        input: {
          ...input.variants.size.xs,
          pe: "12",
        },
        item: { _icon: { boxSize: "3.5" }, gap: "2", minH: "8", px: "1" },
        itemGroup: { gap: "0.5" },
        itemGroupLabel: { height: "8", px: "1" },
      },
    },
    variant: {
      outline: {
        input: input.variants.variant.outline,
      },
      subtle: {
        input: input.variants.variant.subtle,
      },
      surface: {
        input: input.variants.variant.surface,
      },
    },
  },
});
