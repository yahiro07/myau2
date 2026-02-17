//must be synced with ParameterAddresses.h

enum ParameterAddressInSwift: AUParameterAddress {
  case osc1On = 0
  case osc1Wave
  case osc1Octave
  case osc1PwMix
  case osc1Volume
  //
  case osc2On
  case osc2Wave
  case osc2Octave
  case osc2Detune
  case osc2Volume
  //
  case filterOn
  case filterType
  case filterCutoff
  case filterPeak
  case filterEnvMod
  //
  case ampOn
  case ampAttack
  case ampDecay
  case ampSustain
  case ampRelease
  //
  case lfoOn
  case lfoWave
  case lfoRate
  case lfoDepth
  case lfoTarget
  //
  case egOn
  case egAttack
  case egDecay
  case egAmount
  case egTarget
  //
  case glide
  case voicingMode
  case masterVolume
  //
  case numParameters
}
