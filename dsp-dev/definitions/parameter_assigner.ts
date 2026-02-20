import { parameterCode } from "./parameter_keys";
import { SynthParametersSuit } from "./parameters";

function floatToBool(value: number) {
  return value > 0.5;
}

function floatToInt(value: number) {
  return Math.round(value);
}

export function assignParameter(
  synthParameters: SynthParametersSuit,
  code: number,
  value: number,
) {
  const sp = synthParameters;
  const PK = parameterCode;
  if (code === PK.osc1On) sp.osc1On = floatToBool(value);
  else if (code === PK.osc1Wave) sp.osc1Wave = floatToInt(value);
  else if (code === PK.osc1Octave) sp.osc1Octave = value;
  else if (code === PK.osc1PwMix) sp.osc1PwMix = value;
  else if (code === PK.osc1Volume) sp.osc1Volume = value;
  //
  else if (code === PK.osc2On) sp.osc2On = floatToBool(value);
  else if (code === PK.osc2Wave) sp.osc2Wave = floatToInt(value);
  else if (code === PK.osc2Octave) sp.osc2Octave = value;
  else if (code === PK.osc2Detune) sp.osc2Detune = value;
  else if (code === PK.osc2Volume) sp.osc2Volume = value;
  //
  else if (code === PK.filterOn) sp.filterOn = floatToBool(value);
  else if (code === PK.filterType) sp.filterType = floatToInt(value);
  else if (code === PK.filterCutoff) sp.filterCutoff = value;
  else if (code === PK.filterPeak) sp.filterPeak = value;
  else if (code === PK.filterEnvMod) sp.filterEnvMod = value;
  //
  else if (code === PK.ampOn) sp.ampOn = floatToBool(value);
  else if (code === PK.ampAttack) sp.ampAttack = value;
  else if (code === PK.ampDecay) sp.ampDecay = value;
  else if (code === PK.ampSustain) sp.ampSustain = value;
  else if (code === PK.ampRelease) sp.ampRelease = value;
  //
  else if (code === PK.lfoOn) sp.lfoOn = floatToBool(value);
  else if (code === PK.lfoWave) sp.lfoWave = floatToInt(value);
  else if (code === PK.lfoRate) sp.lfoRate = value;
  else if (code === PK.lfoDepth) sp.lfoDepth = value;
  else if (code === PK.lfoTarget) sp.lfoTarget = floatToInt(value);
  //
  else if (code === PK.egOn) sp.egOn = floatToBool(value);
  else if (code === PK.egAttack) sp.egAttack = value;
  else if (code === PK.egDecay) sp.egDecay = value;
  else if (code === PK.egAmount) sp.egAmount = value;
  else if (code === PK.egTarget) sp.egTarget = floatToInt(value);
  //
  else if (code === PK.glide) sp.glide = value;
  else if (code === PK.voicingMode) sp.voicingMode = floatToInt(value);
  else if (code === PK.masterVolume) sp.masterVolume = value;
}
