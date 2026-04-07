import type { IDspCore } from "./api";
import { createSynthesizerRoot } from "./synthesizer-root";

export type { IDspCore } from "./api";

export function createDspCoreInstance(): IDspCore {
  return createSynthesizerRoot();
}
