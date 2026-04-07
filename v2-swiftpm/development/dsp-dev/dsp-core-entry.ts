import type { IDspCore } from "./definitions/api";
import { createSynthesizerRoot } from "./synthesizer-root";

export type { IDspCore } from "./definitions/api";

export function createDspCoreInstance(): IDspCore {
  return createSynthesizerRoot();
}
