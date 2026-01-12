import { fieldAnatomy } from "@ark-ui/react/anatomy";
import { defineSlotRecipe } from "@pandacss/dev";

export const field = defineSlotRecipe({
  base: {
    errorText: {
      color: "error",
      textStyle: "sm",
    },
    helperText: {
      _disabled: {
        layerStyle: "disabled",
      },
      color: "fg.muted",
      textStyle: "sm",
    },
    label: {
      _disabled: {
        layerStyle: "disabled",
      },
      alignItems: "center",
      color: "fg.default",
      display: "flex",
      gap: "0.5",
      textAlign: "start",
      textStyle: "label",
      userSelect: "none",
    },
    requiredIndicator: {
      color: "colorPalette.solid",
    },
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
    },
  },
  className: "field",
  slots: fieldAnatomy.keys(),
});
