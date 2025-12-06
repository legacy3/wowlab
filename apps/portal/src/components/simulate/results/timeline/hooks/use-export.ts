import { useCallback, type RefObject } from "react";
import type Konva from "konva";
import { jsPDF } from "jspdf";

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

function generateFilename(extension: string): string {
  return `timeline-${Date.now()}.${extension}`;
}

interface UseExportOptions {
  stageRef: RefObject<Konva.Stage | null>;
  contentHeight: number;
}

interface UseExportReturn {
  exportPNG: () => void;
  exportPDF: () => void;
}

export function useExport({
  stageRef,
  contentHeight,
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

    downloadFile(dataURL, generateFilename("png"));
  }, [stageRef]);

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
    pdf.setFillColor(
      parseInt(EXPORT_CONFIG.backgroundColor.slice(1, 3), 16),
      parseInt(EXPORT_CONFIG.backgroundColor.slice(3, 5), 16),
      parseInt(EXPORT_CONFIG.backgroundColor.slice(5, 7), 16),
    );
    pdf.rect(0, 0, width, contentHeight, "F");

    pdf.addImage(dataURL, 0, 0, width, contentHeight);
    pdf.save(generateFilename("pdf"));
  }, [stageRef, contentHeight, getExportDataURL]);

  return { exportPNG, exportPDF };
}
