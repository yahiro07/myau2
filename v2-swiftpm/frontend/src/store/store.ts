import { createStore } from "snap-store";
import { PresetListItem } from "@/preset-manager/preset-data-types";
import {
  defaultSynthParameters,
  ParameterKey,
  SynthParametersSuit,
} from "@/store/parameters";

export type StoreState = SynthParametersSuit & {
  standaloneFlag: boolean;
  editTarget: ParameterKey | null;
  presetItems: PresetListItem[];
  latestParametersVersion: number;
  lastLoadedPresetKey: string | null;
};

export const store = createStore<StoreState>({
  ...defaultSynthParameters,
  standaloneFlag: false,
  editTarget: null,
  presetItems: [],
  latestParametersVersion: 0,
  lastLoadedPresetKey: null,
});
