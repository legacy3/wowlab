import * as fabric from "fabric";

const imageCache = new Map<string, HTMLImageElement>();

export function batchAdd(
  canvas: fabric.Canvas,
  objects: fabric.FabricObject[],
): void {
  for (const obj of objects) {
    canvas.add(obj);
  }
  canvas.requestRenderAll();
}

export function batchRemove(
  canvas: fabric.Canvas,
  objects: fabric.FabricObject[],
): void {
  for (const obj of objects) {
    canvas.remove(obj);
  }
  canvas.requestRenderAll();
}

export async function preloadImages(
  urls: string[],
): Promise<Map<string, HTMLImageElement>> {
  const results = new Map<string, HTMLImageElement>();
  const unique = [...new Set(urls)];

  await Promise.all(
    unique.map(
      (url) =>
        new Promise<void>((resolve) => {
          const cached = imageCache.get(url);
          if (cached) {
            results.set(url, cached);
            resolve();
            return;
          }

          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            imageCache.set(url, img);
            results.set(url, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  );

  return results;
}
