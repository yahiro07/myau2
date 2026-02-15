//
//  myau2App.swift
//  myau2
//
//  Created by ore on 2026/02/09.
//

import SwiftUI

@main
struct myau2App: App {
  private let hostModel = AudioUnitHostModel()

  var body: some Scene {
    WindowGroup {
      ContentView2(hostModel: hostModel).ignoresSafeArea()
    }
  }
}
