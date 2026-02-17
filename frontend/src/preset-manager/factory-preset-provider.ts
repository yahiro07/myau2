import { logger } from "@/bridge/logger";
import { PresetData, PresetListItem } from "@/preset-manager/preset-data-types";

type FactoryPresetProvider = {
  listPresetItems(): Promise<PresetListItem[]>;
  loadPreset(presetKey: string): Promise<PresetData>;
};

type MetaJson = Record<string, string>; //rawPresetKey: presetName

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
        return Object.entries(metaJson).map(([rawPresetKey, presetName]) => {
          //prefixing "factory:" to distinguish from user presets.
          //e.g rawPresetKey: "preset1" --> presetKey: "factory:preset1"
          const presetKey = `factory:${rawPresetKey}`;
          return {
            presetKey,
            presetName,
            createAt: 0,
            presetKind: "factory" as const,
          };
        });
      } catch (e) {
        logger.logError(e, "error@listFactoryPresets");
        return [];
      }
    },
    async loadPreset(presetKey) {
      logger.log(`Loading factory preset: ${presetKey}`);
      const rawPresetKey = presetKey.replace(/^factory:/, "");
      return await fetchAssetsJson<PresetData>(`/presets/${rawPresetKey}.json`);
    },
  };
}
