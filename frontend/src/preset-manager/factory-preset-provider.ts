import { PresetData, PresetListItem } from "@/preset-manager/preset-data-types";

type FactoryPresetProvider = {
  listPresetItems(): Promise<PresetListItem[]>;
  loadPreset(presetKey: string): Promise<PresetData>;
};

type MetaJson = Record<string, string>; //presetKey: presetName

async function fetchAssetsJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${path}`);
  }
  return await response.json();
}

export function createFactoryPresetProvider(): FactoryPresetProvider {
  return {
    async listPresetItems() {
      const metaJson = await fetchAssetsJson<MetaJson>(
        "./factory_presets/meta.json",
      );
      return Object.entries(metaJson).map(([presetKey, presetName]) => ({
        presetKey,
        presetName,
        createAt: 0,
        presetKind: "factory" as const,
      }));
    },
    async loadPreset(presetKey) {
      return await fetchAssetsJson<PresetData>(
        `./factory_presets/${presetKey}.json`,
      );
    },
  };
}
