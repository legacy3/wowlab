import path from "path";

export function getLibAliases(libRoot: string): Record<string, string> {
  return {
    "@domain": path.resolve(libRoot, "./src/domain"),
    "@services": path.resolve(libRoot, "./src/services"),
    "@rotation": path.resolve(libRoot, "./src/rotation"),
    "@schemas": path.resolve(libRoot, "./src/schemas"),
    "@bootstrap": path.resolve(libRoot, "./src/bootstrap"),
    "@data": path.resolve(libRoot, "./src/data"),
  };
}
