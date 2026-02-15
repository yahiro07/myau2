//
//  AudioUnitViewModel.swift
//  myau2
//
//  Created by ore on 2026/02/09.
//

import AudioToolbox
import CoreAudioKit
import SwiftUI

struct AudioUnitViewModel {
  var showAudioControls: Bool = false
  var showMIDIControls: Bool = false
  var title: String = "-"
  var message: String = "No Audio Unit loaded.."
  var viewController: ViewController?
}
