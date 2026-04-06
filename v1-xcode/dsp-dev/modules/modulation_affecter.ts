import { ModTarget } from "../definitions/parameters";
import { VoiceState } from "../definitions/state_bus";
import { clampValue01, power2, power3 } from "../functions/number_utils";

export function applyUnitParameterModulated(
  voiceState: VoiceState,
  originalValue: number,
  modTarget: ModTarget | undefined,
) {
  const sp = voiceState.synthParameters;
  const interm = voiceState.intermediate;
  let mod = 0;
  if (sp.lfoOn && sp.lfoTarget === modTarget) {
    mod += interm.lfoOutputValue * power2(sp.lfoDepth);
  }
  if (sp.egOn && sp.egTarget === modTarget) {
    mod += interm.modEgLevel * power2(sp.egAmount);
  }
  return clampValue01(originalValue + mod);
}

export function getOscModRelNote(voiceState: VoiceState, modTarget: ModTarget) {
  const sp = voiceState.synthParameters;
  const interm = voiceState.intermediate;
  let modRelNote = 0;
  if (sp.lfoOn && sp.lfoTarget === modTarget) {
    modRelNote += interm.lfoOutputValue * power3(sp.lfoDepth) * 4;
  }
  if (sp.egOn && sp.egTarget === modTarget) {
    modRelNote += interm.modEgLevel * power2(sp.egAmount) * 12;
  }
  return modRelNote;
}
