"use client";

import { useCallback, type RefObject } from "react";
import type Konva from "konva";
import { jsPDF } from "jspdf";
import { parseHexColor } from "@/lib/hex";

const EXPORT_CONFIG = {
  pixelRatio: 2,
  mimeType: "image/png" as const,
  imageSmoothingEnabled: true,
  backgroundColor: "#1a1a1a",
} as const;

function downloadFile(dataURL: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generateFilename(prefix: string, extension: string): string {
  return `${prefix}-${Date.now()}.${extension}`;
}

interface UseExportOptions {
  stageRef: RefObject<Konva.Stage | null>;
  contentHeight: number;
  filenamePrefix: string;
}

interface UseExportReturn {
  exportPNG: () => void;
  exportPDF: () => void;
}

export function useExport({
  stageRef,
  contentHeight,
  filenamePrefix,
}: UseExportOptions): UseExportReturn {
  const getExportDataURL = useCallback(
    (height: number) => {
      const stage = stageRef.current;
      if (!stage) {
        return null;
      }

      return stage.toDataURL({
        pixelRatio: EXPORT_CONFIG.pixelRatio,
        mimeType: EXPORT_CONFIG.mimeType,
        imageSmoothingEnabled: EXPORT_CONFIG.imageSmoothingEnabled,
        y: 0,
        height,
      });
    },
    [stageRef],
  );

  const exportPNG = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const dataURL = stage.toDataURL({
      pixelRatio: 3, // Higher for PNG since file size is less concern
      mimeType: EXPORT_CONFIG.mimeType,
      imageSmoothingEnabled: EXPORT_CONFIG.imageSmoothingEnabled,
    });

    downloadFile(dataURL, generateFilename(filenamePrefix, "png"));
  }, [filenamePrefix, stageRef]);

  const exportPDF = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const width = stage.width();
    const dataURL = getExportDataURL(contentHeight);
    if (!dataURL) {
      return;
    }

    const pdf = new jsPDF("l", "px", [width, contentHeight]);

    // Fill background to cover transparent areas
    const { r, g, b } = parseHexColor(EXPORT_CONFIG.backgroundColor);
    pdf.setFillColor(r, g, b);
    pdf.rect(0, 0, width, contentHeight, "F");

    pdf.addImage(dataURL, 0, 0, width, contentHeight);
    pdf.save(generateFilename(filenamePrefix, "pdf"));
  }, [stageRef, contentHeight, getExportDataURL, filenamePrefix]);

  return { exportPNG, exportPDF };
}
