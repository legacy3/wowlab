import { defineLayerStyles } from "@pandacss/dev";

export const layerStyles = defineLayerStyles({
  disabled: {
    value: {
      cursor: "not-allowed",
      filter: "grayscale(100%)",
      opacity: "0.67",
    },
  },
});
