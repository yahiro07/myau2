import { Store } from "snap-store";
import { parametersConverter } from "@/bridge/converter";
import { CoreBridge } from "@/bridge/core-bridge";
import { filterObjectMembers } from "@/utils/general-utils";
import { PresetFilesIO, PresetParametersIO } from "./preset-manager-core";

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

export function createStorePresetParametersIO<T extends object>(
  coreBridge: CoreBridge,
  store: Store<T>,
  defaultSynthParameters: T,
): PresetParametersIO {
  return {
    getParameters() {
      const params = filterObjectMembers(store.state, defaultSynthParameters);
      return parametersConverter.mapStoreParametersToFloatParameters(
        params,
        defaultSynthParameters,
      );
    },
    setParameters(rawParameters) {
      const storeParameters =
        parametersConverter.mapFloatParametersToStoreParameters(
          rawParameters,
          defaultSynthParameters,
        );
      store.mutations.assigns(storeParameters);
      coreBridge.sendMessage({
        type: "bulkSendParameters",
        parameters: rawParameters,
      });
    },
  };
}
