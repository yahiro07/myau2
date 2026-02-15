import Foundation

@MainActor
struct TypeSafeObservableParameters {

  let osc1Wave: ObservableAUParameter
  let osc1Octave: ObservableAUParameter
  let osc1PwMix: ObservableAUParameter
  let osc1Volume: ObservableAUParameter
  //
  let osc2Wave: ObservableAUParameter
  let osc2Octave: ObservableAUParameter
  let osc2PwMix: ObservableAUParameter
  let osc2Volume: ObservableAUParameter
  //
  let filterType: ObservableAUParameter
  let filterCutoff: ObservableAUParameter
  let filterPeak: ObservableAUParameter
  let filterEnvMod: ObservableAUParameter
  //
  let ampAttack: ObservableAUParameter
  let ampDecay: ObservableAUParameter
  let ampSustain: ObservableAUParameter
  let ampRelease: ObservableAUParameter
  let ampVolume: ObservableAUParameter
  //
  let lfoWave: ObservableAUParameter
  let lfoRate: ObservableAUParameter
  let lfoDepth: ObservableAUParameter
  let lfoDestination: ObservableAUParameter
  //
  let glide: ObservableAUParameter
  let mono: ObservableAUParameter
  let oscOn: ObservableAUParameter

  init(tree: ObservableAUParameterGroup) {
    let group = tree.global
    self.osc1Wave = group.osc1Wave
    self.osc1Octave = group.osc1Octave
    self.osc1PwMix = group.osc1PwMix
    self.osc1Volume = group.osc1Volume
    self.osc2Wave = group.osc2Wave
    self.osc2Octave = group.osc2Octave
    self.osc2PwMix = group.osc2PwMix
    self.osc2Volume = group.osc2Volume
    self.filterType = group.filterType
    self.filterCutoff = group.filterCutoff
    self.filterPeak = group.filterPeak
    self.filterEnvMod = group.filterEnvMod
    self.ampAttack = group.ampAttack
    self.ampDecay = group.ampDecay
    self.ampSustain = group.ampSustain
    self.ampRelease = group.ampRelease
    self.ampVolume = group.ampVolume
    self.lfoWave = group.lfoWave
    self.lfoRate = group.lfoRate
    self.lfoDepth = group.lfoDepth
    self.lfoDestination = group.lfoDestination
    self.glide = group.glide
    self.mono = group.mono
    self.oscOn = group.oscOn
  }
}
