import SwiftUI

struct ViewAccessibleResources {
  let parameterTree: ObservableAUParameterGroup
  let audioUnitPortal: AudioUnitPortal
  let presetManager: PresetManager
}

protocol AUv3PluginCore: AnyObject {
  func buildParameters() -> AUParameterTree
  func getDSPCore() -> UnsafeMutablePointer<DSPCore>
  func createView(
    _ viewAccessibleResources: ViewAccessibleResources
  ) -> AnyView
}
