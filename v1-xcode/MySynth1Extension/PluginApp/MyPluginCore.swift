import AudioToolbox
import SwiftUI

class MyPluginCore: AUv3PluginCore {
  private var mySynthDSP = MySynthDSP()

  let parameterTree = myPluginParameterSpecs.createAUParameterTree()
  let parametersMigrator: ParametersMigrator? = ParametersMigratorImpl()

  func getDSPCore() -> UnsafeMutablePointer<DSPCore> {
    return mySynthDSP.asDSPCorePointer()!
  }

  func createView(
    _ viewAccessibleResources: ViewAccessibleResources
  ) -> AnyView {
    if true {
      //WebView based UI, primary development target for this project.
      return AnyView(MyPluginContentView(viewAccessibleResources))
    } else {
      //A Simple Swift based UI, kept as a minimum working example.
      return AnyView(SwiftBasedSimpleView(parameterTree))
    }
  }

}
