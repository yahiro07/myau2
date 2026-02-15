//
//  myau2App.swift
//  myau2
//
//  Created by ore on 2026/02/09.
//

import SwiftUI

@main
struct myau2App: App {
  @Environment(\.scenePhase) private var scenePhase

  private let hostModel = AudioUnitHostModel()

  var body: some Scene {
    WindowGroup {
      ContentView2(hostModel: hostModel).ignoresSafeArea()
    }.onChange(of: scenePhase) {
      switch scenePhase {
      case .background:
        hostModel.saveState()
      case .inactive:
        break
      case .active:
        break
      @unknown default:
        break
      }
    }
  }
}
