import SwiftUI

public struct HostApp: App {
  private let hostModel = AudioUnitHostModel()

  public init() {}

  public var body: some Scene {
    WindowGroup {
      ContentView(hostModel: hostModel)
    }
  }
}
