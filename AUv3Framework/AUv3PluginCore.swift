import AudioToolbox
import SwiftUI

public protocol ParametersMigrator {
  var latestParametersVersion: Int { get }
  func migrateParametersIfNeeded(paramVer: Int, rawParameters: inout [String: Float])
}

public struct ViewAccessibleResources {
  let parameterTree: ObservableAUParameterGroup
  let audioUnitPortal: AudioUnitPortal
  let presetFilesIO: PresetFilesIO
  let parametersMigrator: ParametersMigrator?
  let stateKvs: StateKvs
}

public protocol AUv3PluginCore: AnyObject {
  func buildParameters() -> AUParameterTree
  func getDSPCore() -> UnsafeMutablePointer<DSPCore>
  func createView(
    _ viewAccessibleResources: ViewAccessibleResources
  ) -> AnyView
  var parametersMigrator: ParametersMigrator? { get }
}
