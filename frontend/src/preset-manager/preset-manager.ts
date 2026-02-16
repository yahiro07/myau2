import { CoreBridge } from "@/bridge/core-bridge";
import {
  defaultSynthParameters,
  SynthParametersSuit,
} from "@/store/parameters";
import { store } from "@/store/store";
import { createPresetManagerCore } from "./preset-manager-core";
import {
  createOnMemoryPresetFilesIO,
  createStorePresetParametersIO,
} from "./preset-manager-core-adapters";

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
      try {
        const items = await presetManagerCore.listPresetItems();
        store.mutations.setPresetItems(items);
      } catch (e) {
        console.error("Failed to load preset list", e);
        //TODO: show error to user
      }
    },
    async loadPreset(presetKey: string) {
      try {
        await presetManagerCore.loadPreset(presetKey);
      } catch (e) {
        console.error(`Failed to load preset: ${presetKey}`, e);
        //TODO: show error to user
      }
    },
    async savePreset(presetKey: string, presetName?: string) {
      try {
        const newItem = await presetManagerCore.savePreset(
          presetKey,
          presetName,
        );
        store.mutations.setPresetItems((prev) => [
          ...prev.filter((item) => item.presetKey !== presetKey),
          newItem,
        ]);
      } catch (e) {
        console.error(`Failed to save preset: ${presetKey}`, e);
        //TODO: show error to user
      }
    },
  };
}
