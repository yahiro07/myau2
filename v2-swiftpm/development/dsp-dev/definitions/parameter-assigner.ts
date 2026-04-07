import { ParameterId } from "../parameter-id";
import { SynthParametersSuit } from "./parameters";

function floatToBool(value: number) {
  return value > 0.5;
}

function floatToInt(value: number) {
  return Math.round(value);
}

export function assignParameter(
  synthParameters: SynthParametersSuit,
  id: number,
  value: number,
) {
  const sp = synthParameters;
  const PK = ParameterId;
  if (id === PK.osc1On) sp.osc1On = floatToBool(value);
  else if (id === PK.osc1Wave) sp.osc1Wave = floatToInt(value);
  else if (id === PK.osc1Octave) sp.osc1Octave = value;
  else if (id === PK.osc1PwMix) sp.osc1PwMix = value;
  else if (id === PK.osc1Volume) sp.osc1Volume = value;
  //
  else if (id === PK.osc2On) sp.osc2On = floatToBool(value);
  else if (id === PK.osc2Wave) sp.osc2Wave = floatToInt(value);
  else if (id === PK.osc2Octave) sp.osc2Octave = value;
  else if (id === PK.osc2Detune) sp.osc2Detune = value;
  else if (id === PK.osc2Volume) sp.osc2Volume = value;
  //
  else if (id === PK.filterOn) sp.filterOn = floatToBool(value);
  else if (id === PK.filterType) sp.filterType = floatToInt(value);
  else if (id === PK.filterCutoff) sp.filterCutoff = value;
  else if (id === PK.filterPeak) sp.filterPeak = value;
  else if (id === PK.filterEnvMod) sp.filterEnvMod = value;
  //
  else if (id === PK.ampOn) sp.ampOn = floatToBool(value);
  else if (id === PK.ampAttack) sp.ampAttack = value;
  else if (id === PK.ampDecay) sp.ampDecay = value;
  else if (id === PK.ampSustain) sp.ampSustain = value;
  else if (id === PK.ampRelease) sp.ampRelease = value;
  //
  else if (id === PK.lfoOn) sp.lfoOn = floatToBool(value);
  else if (id === PK.lfoWave) sp.lfoWave = floatToInt(value);
  else if (id === PK.lfoRate) sp.lfoRate = value;
  else if (id === PK.lfoDepth) sp.lfoDepth = value;
  else if (id === PK.lfoTarget) sp.lfoTarget = floatToInt(value);
  //
  else if (id === PK.egOn) sp.egOn = floatToBool(value);
  else if (id === PK.egAttack) sp.egAttack = value;
  else if (id === PK.egDecay) sp.egDecay = value;
  else if (id === PK.egAmount) sp.egAmount = value;
  else if (id === PK.egTarget) sp.egTarget = floatToInt(value);
  //
  else if (id === PK.glide) sp.glide = value;
  else if (id === PK.voicingMode) sp.voicingMode = floatToInt(value);
  else if (id === PK.masterVolume) sp.masterVolume = value;
}
