import AUv3Framework
import Combine
import CoreAudioKit
import SwiftUI
import os

@MainActor
public class AudioUnitViewController: GenericAudioUnitViewController, AUAudioUnitFactory {

  nonisolated public func createAudioUnit(with componentDescription: AudioComponentDescription)
    throws -> AUAudioUnit
  {
    logger.log("------------")
    logger.log("🎵createAudioUnit")
    let pluginCore = MyPluginCore()
    return try createAudioUnitInternal(with: componentDescription, pluginCore: pluginCore)
  }
}
