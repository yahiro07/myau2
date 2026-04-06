import AudioToolbox
import Foundation

//must be synced with c++ definitions
enum ParameterId: UInt64 {
  case parametersVersion = 0
  case oscEnabled
  case oscWave
  case oscPitch
  case oscVolume
}

let Project1ExtensionParameterSpecs = ParameterTreeSpec {
  ParameterGroupSpec(identifier: "global", name: "Global") {
    ParameterSpec(
      address: ParameterId.parametersVersion.rawValue,
      identifier: "parametersVersion",
      name: "Parameters Version",
      units: .generic,
      valueRange: 0...999999,
      defaultValue: 1,
      flags: [AudioUnitParameterOptions.flag_IsGlobalMeta]
    )
    ParameterSpec(
      address: ParameterId.oscEnabled.rawValue,
      identifier: "oscEnabled",
      name: "Osc Enabled",
      units: .boolean,
      valueRange: 0...1,
      defaultValue: 1,
    )
    ParameterSpec(
      address: 2,
      identifier: "oscWave",
      name: "Osc Wave",
      units: .indexed,
      valueRange: 0...3,
      defaultValue: 0,
      flags: [
        AudioUnitParameterOptions.flag_IsWritable,
        AudioUnitParameterOptions.flag_IsReadable,
        AudioUnitParameterOptions.flag_ValuesHaveStrings,
      ],
      valueStrings: ["Saw", "Square", "Sine", "Noise"],
    )
    ParameterSpec(
      address: ParameterId.oscPitch.rawValue,
      identifier: "oscPitch",
      name: "Osc Pitch",
      units: .generic,
      valueRange: 0...1,
      defaultValue: 0.5,
    )
    ParameterSpec(
      address: ParameterId.oscVolume.rawValue,
      identifier: "oscVolume",
      name: "Osc Volume",
      units: .generic,
      valueRange: 0...1,
      defaultValue: 0.5,
    )
  }
}
