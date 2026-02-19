import { parameterKeys } from "./parameter_keys";
import { SynthParametersSuit } from "./parameters";

function floatToBool(value: number) {
  return value > 0.5;
}

function floatToInt(value: number) {
  return Math.round(value);
}

export function assignParameter(
  synthParameters: SynthParametersSuit,
  paramKey: number,
  value: number,
) {
  const sp = synthParameters;
  const pk = paramKey;
  const PK = parameterKeys;
  if (pk === PK.osc1On) sp.osc1On = floatToBool(value);
  else if (pk === PK.osc1Wave) sp.osc1Wave = floatToInt(value);
  else if (pk === PK.osc1Octave) sp.osc1Octave = value;
  else if (pk === PK.osc1PwMix) sp.osc1PwMix = value;
  else if (pk === PK.osc1Volume) sp.osc1Volume = value;
  //
  else if (pk === PK.osc2On) sp.osc2On = floatToBool(value);
  else if (pk === PK.osc2Wave) sp.osc2Wave = floatToInt(value);
  else if (pk === PK.osc2Octave) sp.osc2Octave = value;
  else if (pk === PK.osc2Detune) sp.osc2Detune = value;
  else if (pk === PK.osc2Volume) sp.osc2Volume = value;
  //
  else if (pk === PK.filterOn) sp.filterOn = floatToBool(value);
  else if (pk === PK.filterType) sp.filterType = floatToInt(value);
  else if (pk === PK.filterCutoff) sp.filterCutoff = value;
  else if (pk === PK.filterPeak) sp.filterPeak = value;
  else if (pk === PK.filterEnvMod) sp.filterEnvMod = value;
  //
  else if (pk === PK.ampOn) sp.ampOn = floatToBool(value);
  else if (pk === PK.ampAttack) sp.ampAttack = value;
  else if (pk === PK.ampDecay) sp.ampDecay = value;
  else if (pk === PK.ampSustain) sp.ampSustain = value;
  else if (pk === PK.ampRelease) sp.ampRelease = value;
  //
  else if (pk === PK.lfoOn) sp.lfoOn = floatToBool(value);
  else if (pk === PK.lfoWave) sp.lfoWave = floatToInt(value);
  else if (pk === PK.lfoRate) sp.lfoRate = value;
  else if (pk === PK.lfoDepth) sp.lfoDepth = value;
  else if (pk === PK.lfoTarget) sp.lfoTarget = floatToInt(value);
  //
  else if (pk === PK.egOn) sp.egOn = floatToBool(value);
  else if (pk === PK.egAttack) sp.egAttack = value;
  else if (pk === PK.egDecay) sp.egDecay = value;
  else if (pk === PK.egAmount) sp.egAmount = value;
  else if (pk === PK.egTarget) sp.egTarget = floatToInt(value);
  //
  else if (pk === PK.glide) sp.glide = value;
  else if (pk === PK.voicingMode) sp.voicingMode = floatToInt(value);
  else if (pk === PK.masterVolume) sp.masterVolume = value;
}
