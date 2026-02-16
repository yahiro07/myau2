import SwiftUI

struct ViewAccessibleResources {
  let parameterTree: ObservableAUParameterGroup
  let audioUnitPortal: AudioUnitPortal
  let presetManager: PresetManager
}

protocol ParametersMigrator {
  var latestParametersVersion: Int { get }
  func migrateParametersIfNeeded(paramVer: Int, rawParameters: [String: Float])
}

protocol AUv3PluginCore: AnyObject {
  func buildParameters() -> AUParameterTree
  func getDSPCore() -> UnsafeMutablePointer<DSPCore>
  func createView(
    _ viewAccessibleResources: ViewAccessibleResources
  ) -> AnyView
  var parametersMigrator: ParametersMigrator? { get }
}
