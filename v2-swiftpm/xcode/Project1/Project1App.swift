import Auv3HostApp
import SwiftUI

@main
struct Project1App: App {
  @Environment(\.scenePhase) private var scenePhase
  private let hostApp = HostApp()

  var body: some Scene {
    hostApp.body.onChange(of: scenePhase) { newPhase in
      switch newPhase {
      case .background:
        hostApp.saveState()
      case .inactive:
        hostApp.saveState()
      case .active:
        break
      @unknown default:
        break
      }
    }
  }
}
