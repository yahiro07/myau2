extension ParameterId: RawRepresentable {
  typealias RawValue = UInt64

  init?(rawValue: RawValue) {
    guard let id = Self.allCases.first(where: { $0.rawValue == rawValue }) else {
      return nil
    }
    self = id
  }

  var rawValue: RawValue {
    return Self.hash(String(describing: self))
  }

  // Same algorithm as Sources/Dsp/parameter-id.h
  private static func hash(_ str: String) -> UInt64 {
    var result: UInt64 = 0x811c_9dc5
    for byte in str.utf8 {
      result ^= UInt64(byte)
      result = result &* 0x0100_0193
    }
    return result
  }
}

enum ParameterId: CaseIterable {
  case parametersVersion
  //
  case osc1On
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
}
