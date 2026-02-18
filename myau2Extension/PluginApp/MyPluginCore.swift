import AUv3Framework
import AudioToolbox
import SwiftUI

class MyPluginCore: AUv3PluginCore {
  private var mySynthDSP = MySynthDSP()

  var parametersMigrator: ParametersMigrator? = ParametersMigratorImpl()

  func buildParameters() -> AUParameterTree {
    myPluginParameterSpecs.createAUParameterTree()
  }

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
      return AnyView(SwiftBasedSimpleView(parameterTree: viewAccessibleResources.parameterTree))
    }
  }

}
