import { createStore } from "snap-store";
import { PresetListItem } from "@/preset-manager/preset-manager-core";
import {
  defaultSynthParameters,
  ParameterKey,
  SynthParametersSuit,
} from "@/store/parameters";

export type StoreState = SynthParametersSuit & {
  standaloneFlag: boolean;
  editTarget: ParameterKey | null;
  presetItems: PresetListItem[];
};

export const store = createStore<StoreState>({
  ...defaultSynthParameters,
  standaloneFlag: false,
  editTarget: null,
  presetItems: [],
});
