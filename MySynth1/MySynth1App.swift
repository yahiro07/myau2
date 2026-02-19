//
//  MySynth1App.swift
//  MySynth1
//
//  Created by ore on 2026/02/19.
//

import SwiftUI

@main
struct MySynth1App: App {
    private let hostModel = AudioUnitHostModel()

    var body: some Scene {
        WindowGroup {
            ContentView(hostModel: hostModel)
        }
    }
}
