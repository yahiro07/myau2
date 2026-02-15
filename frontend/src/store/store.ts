import { createStore } from "snap-store";
import {
  defaultSynthParameters,
  ParameterKey,
  SynthParametersSuit,
} from "@/store/parameters";

export type StoreState = SynthParametersSuit & {
  standaloneFlag: boolean;
  editTarget: ParameterKey | null;
};

export const store = createStore<StoreState>({
  ...defaultSynthParameters,
  standaloneFlag: false,
  editTarget: null,
});
