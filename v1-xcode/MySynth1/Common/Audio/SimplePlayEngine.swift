@preconcurrency import AVFAudio
import AVFoundation
import CoreAudioKit
import Foundation

#if os(iOS) || os(visionOS)
  import UIKit
#elseif os(macOS)
  import AppKit
#endif

/// Wraps and Audio Unit extension and provides helper functions.
extension AVAudioUnit {

  var wantsAudioInput: Bool {
    let componentType = self.auAudioUnit.componentDescription.componentType
    return componentType == kAudioUnitType_MusicEffect || componentType == kAudioUnitType_Effect
  }

  static fileprivate func findComponent(type: String, subType: String, manufacturer: String)
    -> AVAudioUnitComponent?
  {
    // Make a component description matching any Audio Unit of the selected component type.
    let description = AudioComponentDescription(
      componentType: type.fourCharCode!,
      componentSubType: subType.fourCharCode!,
      componentManufacturer: manufacturer.fourCharCode!,
      componentFlags: 0,
      componentFlagsMask: 0)
    return AVAudioUnitComponentManager.shared().components(matching: description).first
  }

  fileprivate func loadAudioUnitViewController() async -> ViewController? {
    let viewController = await auAudioUnit.requestViewController()

    if #available(macOS 13.0, iOS 16.0, *) {
      if viewController == nil {
        let genericViewController = AUGenericViewController()
        await MainActor.run {
          genericViewController.auAudioUnit = self.auAudioUnit
        }
        return genericViewController
      }
    }

    return viewController
  }
}

/// Manages the interaction with the AudioToolbox and AVFoundation frameworks.
@MainActor
@Observable
public class SimplePlayEngine {

  var avAudioUnit: AVAudioUnit?

  // Synchronizes starting/stopping the engine and scheduling file segments.
  private let stateChangeQueue = DispatchQueue(
    label: "com.example.apple-samplecode.StateChangeQueue")

  // Playback engine.
  private let engine = AVAudioEngine()

  // Whether we are playing.
  private(set) var isPlaying = false

  // This block will be called every render cycle and will receive MIDI events
  private let midiOutBlock: AUMIDIOutputEventBlock = { sampleTime, cable, length, data in
    return noErr
  }

  // This block can be used to send MIDI UMP events to the Audio Unit
  var scheduleMIDIEventListBlock: AUMIDIEventListBlock? = nil

  // MARK: Initialization

  public init() {
    // engine.prepare()
    setupMIDI()
  }

  private func setupMIDI() {
    if !MIDIManager.shared.setupPort(
      midiProtocol: MIDIProtocolID._2_0,
      receiveBlock: { [weak self] eventList, _ in
        if let scheduleMIDIEventListBlock = self?.scheduleMIDIEventListBlock {
          _ = scheduleMIDIEventListBlock(AUEventSampleTimeImmediate, 0, eventList)
        }
      })
    {
      fatalError("Failed to setup Core MIDI")
    }
  }

  func initComponent(type: String, subType: String, manufacturer: String) async -> ViewController? {
    // Reset the engine to remove any configured audio units.
    reset()

    guard
      let component = AVAudioUnit.findComponent(
        type: type, subType: subType, manufacturer: manufacturer)
    else {
      fatalError(
        "Failed to find component with type: \(type), subtype: \(subType), manufacturer: \(manufacturer))"
      )
    }

    // Instantiate the audio unit.
    do {
      let audioUnit = try await AVAudioUnit.instantiate(
        with: component.audioComponentDescription,
        options: AudioComponentInstantiationOptions.loadOutOfProcess)

      self.avAudioUnit = audioUnit

      self.connect(avAudioUnit: audioUnit)

      return await audioUnit.loadAudioUnitViewController()
    } catch {
      return nil
    }
  }

  private func setSessionActive(_ active: Bool) {
    #if os(iOS) || os(visionOS)
      do {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default)
        try session.setActive(active)
      } catch {
        fatalError("Could not set Audio Session active \(active). error: \(error).")
      }
    #endif
  }

  // MARK: Playback State

  public func startPlaying() {
    stateChangeQueue.sync {
      if !self.isPlaying { self.startPlayingInternal() }
    }
  }

  public func stopPlaying() {
    stateChangeQueue.sync {
      if self.isPlaying { self.stopPlayingInternal() }
    }
  }

  private func startPlayingInternal() {
    // assumptions: we are protected by stateChangeQueue. we are not playing.
    setSessionActive(true)

    let hardwareFormat = engine.outputNode.outputFormat(forBus: 0)
    engine.connect(engine.mainMixerNode, to: engine.outputNode, format: hardwareFormat)

    // Start the engine.
    do {
      try engine.start()
    } catch {
      isPlaying = false
      fatalError("Could not start engine. error: \(error).")
    }

    isPlaying = true
  }

  private func stopPlayingInternal() {
    engine.stop()
    isPlaying = false
    setSessionActive(false)
  }

  public func reset() {
    connect(avAudioUnit: nil)
  }

  public func connect(avAudioUnit: AVAudioUnit?, completion: @escaping (() -> Void) = {}) {
    guard let avAudioUnit = self.avAudioUnit else {
      return
    }

    // Break the audio unit -> mixer connection
    engine.disconnectNodeInput(engine.mainMixerNode)

    // We're done with the unit; release all references.
    engine.detach(avAudioUnit)

    // Internal function to resume playing and call the completion handler.
    func rewiringComplete() {
      scheduleMIDIEventListBlock = auAudioUnit.scheduleMIDIEventListBlock
      completion()
    }

    let hardwareFormat = engine.outputNode.outputFormat(forBus: 0)

    // Connect the main mixer -> output node
    engine.connect(engine.mainMixerNode, to: engine.outputNode, format: hardwareFormat)

    let auAudioUnit = avAudioUnit.auAudioUnit

    if !auAudioUnit.midiOutputNames.isEmpty {
      auAudioUnit.midiOutputEventBlock = midiOutBlock
    }

    // Attach the AVAudioUnit the graph.
    engine.attach(avAudioUnit)

    let stereoFormat = AVAudioFormat(
      standardFormatWithSampleRate: hardwareFormat.sampleRate, channels: 2)
    engine.connect(avAudioUnit, to: engine.mainMixerNode, format: stereoFormat)
    rewiringComplete()
  }

  func sendMessage(message: [UInt8]) {
    guard let avAudioUnit = self.avAudioUnit else {
      return
    }
    guard let scheduleMIDIEventBlock = avAudioUnit.auAudioUnit.scheduleMIDIEventBlock else {
      return
    }

    // var message: [UInt8] = [0x90, 0x51, 0x64]

    message.withUnsafeBufferPointer { bufferPointer in
      guard let baseAddress = bufferPointer.baseAddress else {
        return
      }

      scheduleMIDIEventBlock(AUEventSampleTimeImmediate, 0, 3, baseAddress)
    }
  }
}
