import { Store } from "snap-store";
import { parametersConverter } from "@/bridge/converter";
import { CoreBridge } from "@/bridge/core-bridge";
import {
  defaultSynthParameters,
  SynthParametersSuit,
} from "@/store/parameters";
import { store } from "@/store/store";
import { filterObjectMembers } from "@/utils/general-utils";
import {
  createPresetManagerCore,
  PresetFilesIO,
  PresetParametersIO,
} from "./preset-manager-core";

function createOnMemoryPresetFilesIO(): PresetFilesIO {
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
  };
}

function createStorePresetParametersIO<T extends object>(
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

export function createPresetManager(coreBridge: CoreBridge) {
  const parametersIO = createStorePresetParametersIO<SynthParametersSuit>(
    coreBridge,
    store,
    defaultSynthParameters,
  );
  const presetFilesIO = createOnMemoryPresetFilesIO();
  const presetManagerCore = createPresetManagerCore(
    presetFilesIO,
    parametersIO,
  );
  presetManagerCore.setLatestParametersVersion(1);
  return {
    async loadPresetList() {
      const items = await presetManagerCore.listPresetItems();
      store.mutations.setPresetItems(items);
    },
    async loadPreset(presetKey: string) {
      await presetManagerCore.loadPreset(presetKey);
    },
    async savePreset(presetKey: string, presetName?: string) {
      await presetManagerCore.savePreset(presetKey, presetName);
    },
  };
}
