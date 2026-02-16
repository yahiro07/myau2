import { CoreBridge } from "@/bridge/core-bridge";
import { PresetFilesIO } from "@/preset-manager/preset-manager-core-port-types";

export function createPluginAppPresetFilesIO(
  _coreBridge: CoreBridge,
): PresetFilesIO {
  return {
    async readFile() {
      throw new Error("Not implemented");
    },
    async writeFile() {
      throw new Error("Not implemented");
    },
    async deleteFile() {
      throw new Error("Not implemented");
    },
  };
}

export function createOnMemoryPresetFilesIO(): PresetFilesIO {
  const fileItems: Record<string, string> = {};
  return {
    async readFile(path) {
      const content = fileItems[path];
      if (!content) {
        throw new Error(`File not found: ${path}`);
      }
      return content;
    },
    async writeFile(path, content, options) {
      if (!options?.append) {
        fileItems[path] = content;
      } else {
        fileItems[path] ??= "";
        fileItems[path] += content;
      }
    },
    async deleteFile(path) {
      delete fileItems[path];
    },
  };
}
