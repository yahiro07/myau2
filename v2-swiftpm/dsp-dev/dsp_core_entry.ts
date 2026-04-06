import { IDspCore } from "./definitions/dsp_core_interface";
import { createSynthesizerRoot } from "./synthesizer_root";

export function createDSPCoreInstance(): IDspCore {
  return createSynthesizerRoot();
}
