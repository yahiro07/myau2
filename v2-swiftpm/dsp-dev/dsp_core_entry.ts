import type { IDspCore } from "./definitions/dsp_core_interface";
import { createSynthesizerRoot } from "./synthesizer_root";

export type { IDspCore } from "./definitions/dsp_core_interface";

export function createDspCoreInstance(): IDspCore {
  return createSynthesizerRoot();
}
