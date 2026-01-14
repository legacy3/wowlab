import { defineSlotRecipe } from "@pandacss/dev";

export const expandable = defineSlotRecipe({
  base: {
    content: {},
    modalBackdrop: {
      bg: "black/95",
      inset: "0",
      p: "8",
      position: "fixed",
      zIndex: "50",
    },
    modalClose: {
      _hover: { bg: "white/20" },
      bg: "white/10",
      borderRadius: "lg",
      cursor: "pointer",
      p: "2",
      position: "absolute",
      right: "4",
      top: "4",
      transition: "background 0.15s ease-in-out",
      zIndex: "10",
    },
    modalContent: {
      maxHeight: "85vh",
      maxWidth: "90vw",
      overflow: "auto",
    },
    root: {
      cursor: "pointer",
      position: "relative",
    },
  },
  className: "expandable",
  jsx: ["Expandable"],
  slots: ["root", "content", "modalBackdrop", "modalClose", "modalContent"],
  variants: {
    variant: {
      diagram: {
        content: {
          "& svg": {
            height: "auto",
            maxHeight: "700px",
            width: "100%",
          },
          display: "flex",
          justifyContent: "center",
          overflowX: "auto",
        },
        modalContent: {
          "& svg": {
            height: "auto",
            maxHeight: "75vh",
            minWidth: "60vw",
            width: "auto",
          },
          bg: "white",
          borderRadius: "lg",
          p: "8",
        },
        root: {
          _hover: {
            bg: "bg.subtle",
            borderColor: "border.default",
          },
          bg: "bg.muted",
          borderColor: "border.muted",
          borderRadius: "lg",
          borderWidth: "1px",
          my: "6",
          p: "6",
          transition: "all 0.15s ease-in-out",
        },
      },
      image: {
        root: {
          display: "block",
          width: "100%",
        },
      },
    },
  },
});
