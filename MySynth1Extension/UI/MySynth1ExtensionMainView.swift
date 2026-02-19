//
//  MySynth1ExtensionMainView.swift
//  MySynth1Extension
//
//  Created by ore on 2026/02/19.
//

import SwiftUI

struct MySynth1ExtensionMainView: View {
    var parameterTree: ObservableAUParameterGroup
    
    var body: some View {
        ParameterSlider(param: parameterTree.global.gain)
    }
}
