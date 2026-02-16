export type PresetData = {
  presetName: string;
  parametersVersion: number;
  parameters: Record<string, number>;
};

export type PresetKind = "factory" | "user";

export type PresetListItem = {
  presetKey: string;
  presetName: string;
  createAt: number;
  presetKind: PresetKind;
};
