import type { IDspCore } from "./definitions/dsp-core-interface";
import { createSynthesizerRoot } from "./synthesizer-root";

export type { IDspCore } from "./definitions/dsp-core-interface";

export function createDspCoreInstance(): IDspCore {
  return createSynthesizerRoot();
}
