import { createStore } from "snap-store";
import {
  defaultSynthParameters,
  ParameterKey,
  SynthParametersSuit,
} from "@/store/parameters";

export type StoreState = SynthParametersSuit & {
  editTarget: ParameterKey | null;
};

export const store = createStore<StoreState>({
  ...defaultSynthParameters,
  editTarget: null,
});
