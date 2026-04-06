import AudioToolbox
import SwiftUI

public protocol ParametersMigrator {
  var latestParametersVersion: Int { get }
  func migrateParametersIfNeeded(paramVer: Int, rawParameters: inout [String: Float])
}

public struct ViewAccessibleResources {
  public let parameterTree: AUParameterTree
  public let audioUnitPortal: AudioUnitPortal
  public let presetFilesIO: PresetFilesIO
  public let parametersMigrator: ParametersMigrator?
  public let stateKvs: StateKvs
}

public protocol AUv3PluginCore: AnyObject {
  var parametersMigrator: ParametersMigrator? { get }
  var parameterTree: AUParameterTree { get }
  func getDSPCore() -> UnsafeMutablePointer<DSPCore>
  func createView(
    _ viewAccessibleResources: ViewAccessibleResources
  ) -> AnyView
}
