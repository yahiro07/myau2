import { parametersConverter } from "@/bridge/converter";
import { CoreBridge } from "@/bridge/core-bridge";
import { createFactoryPresetProvider } from "@/preset-manager/factory-preset-provider";
import { PresetData } from "@/preset-manager/preset-data-types";
import { createSharedKvsAdapter } from "@/preset-manager/shared-kvs-adapter";
import { defaultSynthParameters } from "@/store/parameters";
import { store } from "@/store/store";
import { filterObjectMembers } from "@/utils/general-utils";
import { createPresetManagerCore } from "./preset-manager-core";
import { createOnMemoryPresetFilesIO } from "./preset-manager-core-adapters";

export function createPresetManager(coreBridge: CoreBridge) {
  const factoryPresetProvider = createFactoryPresetProvider();
  const presetFilesIO = createOnMemoryPresetFilesIO();
  const presetManagerCore = createPresetManagerCore(presetFilesIO);
  const sharedKvs = createSharedKvsAdapter(presetFilesIO);

  return {
    async loadPresetList() {
      try {
        const factoryItems = await factoryPresetProvider.listPresetItems();
        const userItems = await presetManagerCore.listPresetItems();
        store.mutations.setPresetItems([...factoryItems, ...userItems]);
        await sharedKvs.initialize();
        const lastLoadedPresetKey = sharedKvs.read("lastLoadedPresetKey");
        if (lastLoadedPresetKey) {
          store.mutations.setLastLoadedPresetKey(lastLoadedPresetKey);
        }
      } catch (e) {
        console.error("Failed to load preset list", e);
        //TODO: show error to user
      }
    },
    async loadPreset(presetKey: string) {
      try {
        const item = store.state.presetItems.find(
          (i) => i.presetKey === presetKey,
        );
        if (item) {
          const loaderFn =
            item.presetKind === "factory"
              ? factoryPresetProvider.loadPreset
              : presetManagerCore.loadPreset;
          const presetData = await loaderFn(presetKey);
          const rawParameters =
            parametersConverter.mapStoreParametersToFloatParameters(
              presetData.parameters,
              defaultSynthParameters,
            );
          //この時点ではストアに値をセットしない
          //loadFullParametersで本体側にパラメタセットを送り、
          //本体側で検証/マイングレーションを行った後全パラメタをUIに送り返すので
          //これを受け取ってストアに値をセットする
          coreBridge.sendMessage({
            type: "loadFullParameters",
            parametersVersion: presetData.parametersVersion,
            parameters: rawParameters,
          });
          if (presetKey !== store.state.lastLoadedPresetKey) {
            store.mutations.setLastLoadedPresetKey(presetKey);
            sharedKvs.write("lastLoadedPresetKey", presetKey);
          }
        }
      } catch (e) {
        console.error(`Failed to load preset: ${presetKey}`, e);
        //TODO: show error to user
      }
    },
    async savePreset(presetKey: string, presetName?: string) {
      try {
        const parameters = filterObjectMembers(
          store.state,
          defaultSynthParameters,
        );
        const presetData: PresetData = {
          presetName: presetName ?? presetKey,
          parametersVersion: store.state.latestParametersVersion,
          parameters,
        };
        const newItem = await presetManagerCore.savePreset(
          presetKey,
          presetData,
        );
        store.mutations.setPresetItems((prev) => [
          ...prev.filter((item) => item.presetKey !== presetKey),
          newItem,
        ]);
        if (presetKey !== store.state.lastLoadedPresetKey) {
          store.mutations.setLastLoadedPresetKey(presetKey);
          sharedKvs.write("lastLoadedPresetKey", presetKey);
        }
      } catch (e) {
        console.error(`Failed to save preset: ${presetKey}`, e);
        //TODO: show error to user
      }
    },
  };
}
