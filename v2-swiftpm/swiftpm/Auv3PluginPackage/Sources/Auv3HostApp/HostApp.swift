import SwiftUI

public struct HostApp: App {
  private let hostModel = AudioUnitHostModel(type: "aumu", subType: "prk3", manufacturer: "Myco")

  public init() {}

  public var body: some Scene {
    WindowGroup {
      #if os(iOS)
        ContentView2(hostModel: hostModel).ignoresSafeArea()  //fullscreen
      #else
        ContentView2(hostModel: hostModel)  //window with title bar
      #endif
    }
  }

  public func saveState() {
    hostModel.saveState()
  }
}
