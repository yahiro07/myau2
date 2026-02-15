import AudioToolbox
import Foundation

let PB: ParameterSpecBuilder<ParameterAddress> = ParameterSpecBuilder()

let oscWaveValues = ["Saw", "Rect", "Tri", "Sine", "Noise"]

let lfoDestinationValues = [
  "None", "Osc1Pitch", "Osc1PWMix", "Osc1Volume", "Osc2Pitch", "Osc2PWMix", "Osc2Volume",
  "FilterCutoff", "AmpVolume",
]

struct DefaultValues {
  // static let osc1Wave = "Saw"
  // static let osc1Volume: Float = 1
  //debug
  static let osc1Wave = "Sine"
  static let osc1Volume: Float = 0.1
}

let myPluginParameterSpecs = ParameterTreeSpec {
  ParameterGroupSpec(identifier: "global", name: "Global") {
    PB.Bool(.osc1On, "osc1On", "OSC1 On", true)
    PB.Enum(.osc1Wave, "osc1Wave", "OSC1 Wave", DefaultValues.osc1Wave, oscWaveValues)
    PB.Unary(.osc1Octave, "osc1Octave", "OSC1 Octave", 0.5)
    PB.Unary(.osc1PwMix, "osc1PwMix", "OSC1 PwMix", 0.5)
    PB.Unary(.osc1Volume, "osc1Volume", "OSC1 Volume", DefaultValues.osc1Volume)
    //
    PB.Bool(.osc2On, "osc2On", "OSC2 On", false)
    PB.Enum(.osc2Wave, "osc2Wave", "OSC2 Wave", "Saw", oscWaveValues)
    PB.Unary(.osc2Octave, "osc2Octave", "OSC2 Octave", 0.5)
    PB.Unary(.osc2Detune, "osc2Detune", "OSC2 Detune", 0.5)
    PB.Unary(.osc2Volume, "osc2Volume", "OSC2 Volume", 0.5)
    //
    PB.Bool(.filterOn, "filterOn", "Filter On", true)
    PB.Enum(.filterType, "filterType", "Filter Type", "LPF", ["LPF", "BPF", "HPF"])
    PB.Unary(.filterCutoff, "filterCutoff", "Filter Cutoff", 1.0)
    PB.Unary(.filterPeak, "filterPeak", "Filter Peak", 0.0)
    PB.Unary(.filterEnvMod, "filterEnvMod", "Filter EnvMod", 0.5)
    //
    PB.Bool(.ampOn, "ampOn", "Amp On", true)
    PB.Unary(.ampAttack, "ampAttack", "Amp Attack", 0.0)
    PB.Unary(.ampDecay, "ampDecay", "Amp Decay", 0.0)
    PB.Unary(.ampSustain, "ampSustain", "Amp Sustain", 1.0)
    PB.Unary(.ampRelease, "ampRelease", "Amp Release", 0.0)
    //
    PB.Bool(.lfoOn, "lfoOn", "LFO On", false)
    PB.Enum(.lfoWave, "lfoWave", "LFO Wave", "Saw", oscWaveValues)
    PB.Unary(.lfoRate, "lfoRate", "LFO Rate", 0.5)
    PB.Unary(.lfoDepth, "lfoDepth", "LFO Depth", 0.5)
    PB.Enum(.lfoTarget, "lfoTarget", "LFO Target", "None", lfoDestinationValues)
    //
    PB.Bool(.egOn, "egOn", "EG On", false)
    PB.Unary(.egAttack, "egAttack", "EG Attack", 0.0)
    PB.Unary(.egDecay, "egDecay", "EG Decay", 0.0)
    PB.Unary(.egAmount, "egAmount", "EG Amount", 0.5)
    PB.Enum(.egTarget, "egTarget", "EG Target", "None", lfoDestinationValues)
    //
    PB.Unary(.glide, "glide", "glide", 0.0)
    PB.Enum(.voicingMode, "voicingMode", "Voicing Mode", "Mono", ["Mono", "Poly"])
    PB.Unary(.masterVolume, "masterVolume", "Master Volume", 0.8)
  }
}
