import { logger } from "@/bridge/logger";
import { PresetData, PresetListItem } from "@/preset-manager/preset-data-types";

type FactoryPresetProvider = {
  listPresetItems(): Promise<PresetListItem[]>;
  loadPreset(presetKey: string): Promise<PresetData>;
};

type MetaJson = Record<string, string>; //presetKey: presetName

export async function fetchAssetsJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${path}`);
  }
  const text = await response.text();

  if (!(text.startsWith("{") || text.startsWith("["))) {
    throw new Error(`Invalid JSON content in ${path}`);
  }
  return JSON.parse(text) as T;
}

export function createFactoryPresetProvider(): FactoryPresetProvider {
  return {
    async listPresetItems() {
      try {
        const metaJson = await fetchAssetsJson<MetaJson>("/presets/meta.json");
        logger.log(`Loaded factory preset meta: ${JSON.stringify(metaJson)}`);
        return Object.entries(metaJson).map(([presetKey, presetName]) => ({
          presetKey,
          presetName,
          createAt: 0,
          presetKind: "factory" as const,
        }));
      } catch (e) {
        logger.logError(e, "error@listFactoryPresets");
        return [];
      }
    },
    async loadPreset(presetKey) {
      return await fetchAssetsJson<PresetData>(
        `./factory_presets/${presetKey}.json`,
      );
    },
  };
}
