//
//  myau2ExtensionAudioUnit.swift
//  myau2Extension
//
//  Created by ore on 2026/02/09.
//

import AVFoundation
import CoreAudioKit

public class GenericAudioUnit: AUAudioUnit, @unchecked Sendable {
  // C++ Objects
  var kernel = GenericDSPKernel()
  var processHelper: GenericAUProcessHelper?

  private var outputBus: AUAudioUnitBus?
  private var _outputBusses: AUAudioUnitBusArray!

  private var format: AVAudioFormat

  private(set) var pluginCore: AUv3PluginCore?

  let portal: AudioUnitPortalImpl = AudioUnitPortalImpl()
  let presetManager: PresetManagerImpl = PresetManagerImpl()

  @objc override init(
    componentDescription: AudioComponentDescription, options: AudioComponentInstantiationOptions,
  ) throws {
    logger.log("GenericExtensionAudioUnit init 1609")
    logger.log("Loaded From: " + Bundle.main.bundlePath)

    self.format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2)!

    try super.init(componentDescription: componentDescription, options: options)
    outputBus = try AUAudioUnitBus(format: self.format)
    outputBus?.maximumChannelCount = 2
    _outputBusses = AUAudioUnitBusArray(
      audioUnit: self, busType: AUAudioUnitBusType.output, busses: [outputBus!])
    processHelper = GenericAUProcessHelper(&kernel)
    portal.setMidiDestinationFn({ [weak self] (bytes: [UInt8]) in
      self?.pushScheduledMidiEvent(bytes)
    })
  }

  public override func supportedViewConfigurations(
    _ availableViewConfigurations: [AUAudioUnitViewConfiguration]
  ) -> IndexSet {
    return IndexSet(integersIn: 0..<availableViewConfigurations.count)
  }

  private func pullRTAudioPortalEventOne() -> AudioUnitPortalEvent? {
    var rawEvent = LowLevelPortalEvent()
    guard processHelper?.popLowLevelPortalEvent(&rawEvent) == true else {
      return nil
    }
    return mapPortalEventFromRaw(rawEvent)
  }

  //メインスレッドでタイマを使ってポーリングしてイベントを流す
  //オーディオスレッド上で拾い上げたMIDIノートのイベントをメインスレッド上でUIに流す
  //AudioUnitViewController側で一定周期でループを回してこれを呼ぶ想定
  func drainRealtimeEventsOnMainThread(maxCount: Int = 64) {
    var count = 0
    while count < maxCount, let event = pullRTAudioPortalEventOne() {
      portal.emitEvent(event)
      count += 1
    }
  }

  //push MIDI note sent from internal UI
  private func pushScheduledMidiEvent(_ bytes: [UInt8]) {
    guard let midiBlock = scheduleMIDIEventBlock else { return }
    midiBlock(
      AUEventSampleTimeImmediate, 0, Int(bytes.count), bytes
    )
  }

  func setupPluginCore(_ pluginCore: AUv3PluginCore) {
    self.pluginCore = pluginCore
    let dspCore = pluginCore.getDSPCore()
    kernel.setDSPCore(&dspCore.pointee)
    self.setupParameterTree(pluginCore.buildParameters())
  }

  public override var outputBusses: AUAudioUnitBusArray {
    return _outputBusses
  }

  public override var maximumFramesToRender: AUAudioFrameCount {
    get {
      return kernel.maximumFramesToRender()
    }

    set {
      kernel.setMaximumFramesToRender(newValue)
    }
  }

  public override var shouldBypassEffect: Bool {
    get {
      return kernel.isBypassed()
    }

    set {
      kernel.setBypass(newValue)
    }
  }

  // MARK: - MIDI
  public override var audioUnitMIDIProtocol: MIDIProtocolID {
    return processHelper!.AudioUnitMIDIProtocol()
  }

  // MARK: - Rendering
  public override var internalRenderBlock: AUInternalRenderBlock {
    return processHelper!.internalRenderBlock()
  }

  // Allocate resources required to render.
  // Subclassers should call the superclass implementation.
  public override func allocateRenderResources() throws {
    let outputChannelCount = self.outputBusses[0].format.channelCount

    kernel.setMusicalContextBlock(self.musicalContextBlock)
    kernel.initialize(Int32(outputChannelCount), outputBus!.format.sampleRate)

    processHelper?.setChannelCount(0, self.outputBusses[0].format.channelCount)

    try super.allocateRenderResources()
  }

  // Deallocate resources allocated in allocateRenderResourcesAndReturnError:
  // Subclassers should call the superclass implementation.
  public override func deallocateRenderResources() {

    // Deallocate your resources.
    kernel.deInitialize()

    super.deallocateRenderResources()
  }

  public func setupParameterTree(_ parameterTree: AUParameterTree) {
    self.parameterTree = parameterTree

    let maxAddress = parameterTree.allParameters.map { $0.address }.max() ?? 0
    let capacity64 = maxAddress &+ 1
    let capacity = UInt32(min(capacity64, UInt64(UInt32.max)))
    kernel.setParameterCapacity(capacity)

    // Set the Parameter default values before setting up the parameter callbacks
    for param in parameterTree.allParameters {
      if param.address == 0 || param.address == 1 {
        logger.log("Param Default: \(param.address) \(param.identifier) to \(param.value)")
      }

      kernel.setParameter(param.address, param.value)
    }

    setupParameterCallbacks()
  }

  private func setupParameterCallbacks() {
    // implementorValueObserver is called when a parameter changes value.
    parameterTree?.implementorValueObserver = { [weak self] param, value -> Void in
      // logger.log("Param Change: \(param.address) \(param.identifier) to \(value)")
      if param.address == 0 || param.address == 1 {
        logger.log("Param Change: \(param.address) \(param.identifier) to \(value)")
      }
      self?.kernel.setParameter(param.address, value)
    }

    // implementorValueProvider is called when the value needs to be refreshed.
    parameterTree?.implementorValueProvider = { [weak self] param in
      let value = self!.kernel.getParameter(param.address)
      if param.address == 0 || param.address == 1 {
        logger.log("Param Get: \(param.address) \(param.identifier) is \(value)")
      }

      return value
    }

    // A function to provide string representations of parameter values.
    parameterTree?.implementorStringFromValueCallback = { param, valuePtr in
      guard let value = valuePtr?.pointee else {
        return "-"
      }
      return NSString.localizedStringWithFormat("%.f", value) as String
    }
  }

  func parameterStateData() -> Data {
    var values: [Float] = parameterTree!.allParameters.map {
      $0.value
    }
    return Data(bytes: &values, count: values.count * MemoryLayout<Float>.size)
  }

  func restoreParameterState(from data: Data) {
    let count = data.count / MemoryLayout<Float>.size
    data.withUnsafeBytes { ptr in
      let buffer = ptr.bindMemory(to: Float.self)
      for i in 0..<count {
        parameterTree!.allParameters[i].value = buffer[i]
      }
    }
  }

  //debug
  // override public var fullState: [String: Any]? {
  //   get {
  //     udpLogger.log("Saving state")
  //     var state = super.fullState ?? [:]
  //     state["foo"] = "bar buzz"
  //     return state
  //   }
  //   set {
  //     udpLogger.log("Restoring state")
  //     guard let state = newValue else { return }
  //     if let data = state["foo"] as? String {
  //       udpLogger.log("Restoring foo: \(data)")
  //     }
  //     super.fullState = state
  //   }
  // }

  public override var fullState: [String: Any]? {
    get {
      logger.log("Saving state")
      var state = super.fullState ?? [:]
      state["myParams"] = parameterStateData()
      return state
    }

    set {
      guard let state = newValue else { return }
      logger.log("Restoring state data: \(state)")
      if let flag = state["myau2.hostedInStandaloneApp"] as? Bool {
        logger.log("received hostedInStandaloneApp flag: \(flag)")
        // portal.emitEvent(.standaloneAppFlag(true))
        portal.isHostedInStandaloneApp = true
      }
      if let data = state["myParams"] as? Data {
        restoreParameterState(from: data)
      }
      super.fullState = state
    }
  }

}
