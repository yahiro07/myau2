import { parametersConverter } from "@/bridge/converter";
import { CoreBridge } from "@/bridge/core-bridge";
import { logger } from "@/bridge/logger";
import { createFactoryPresetProvider } from "@/preset-manager/factory-preset-provider";
import { PresetData } from "@/preset-manager/preset-data-types";
import { PresetFilesIO } from "@/preset-manager/preset-manager-core-port-types";
import { StateKvsAdapter } from "@/preset-manager/state-kvs-adapter";
import { defaultSynthParameters } from "@/store/parameters";
import { store } from "@/store/store";
import { filterObjectMembers } from "@/utils/general-utils";
import { createPresetManagerCore } from "./preset-manager-core";

export function createPresetManager(
  coreBridge: CoreBridge,
  stateKvs: StateKvsAdapter,
  presetFilesIO: PresetFilesIO,
) {
  const factoryPresetProvider = createFactoryPresetProvider();
  const presetManagerCore = createPresetManagerCore(presetFilesIO);

  return {
    async loadPresetList() {
      try {
        logger.log("loadPresetList");
        if (0) {
          const factoryItems = await factoryPresetProvider.listPresetItems();
          const userItems = await presetManagerCore.listPresetItems();
          store.mutations.setPresetItems([...factoryItems, ...userItems]);
        } else {
          const userItems = await presetManagerCore.listPresetItems();
          store.mutations.setPresetItems([...userItems]);
        }
        const lastLoadedPresetKey = stateKvs.read("lastLoadedPresetKey");
        logger.log(`lastLoadedPresetKey: ${lastLoadedPresetKey}`);
        if (lastLoadedPresetKey) {
          store.mutations.setLastLoadedPresetKey(lastLoadedPresetKey);
        }
      } catch (e: unknown) {
        logger.logError(e, "error@loadPresetList");
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
            stateKvs.write("lastLoadedPresetKey", presetKey);
          }
        }
      } catch (e) {
        logger.logError(e, `error@loadPreset, presetKey: ${presetKey}`);
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
          stateKvs.write("lastLoadedPresetKey", presetKey);
        }
      } catch (e) {
        logger.logError(e, `error@savePreset, presetKey: ${presetKey}`);
      }
    },
  };
}
