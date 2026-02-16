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
    return AnyView(MyPluginContentView(viewAccessibleResources))
  }

}
