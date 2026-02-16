import { CoreBridge } from "@/bridge/core-bridge";
import {
  defaultSynthParameters,
  SynthParametersSuit,
} from "@/store/parameters";
import { store } from "@/store/store";
import {
  createOnMemoryPresetFilesIO,
  createStorePresetParametersIO,
} from "./adapters";
import { createPresetManagerCore } from "./preset-manager-core";

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
