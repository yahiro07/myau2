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

  let stateKvs = StateKvs()

  private(set) var isHostedInStandaloneApp: Bool = false
  private(set) var currentPresetParametersVersion: Int = 0

  @objc override init(
    componentDescription: AudioComponentDescription, options: AudioComponentInstantiationOptions,
  ) throws {
    logger.log("GenericExtensionAudioUnit init")

    self.format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2)!

    try super.init(componentDescription: componentDescription, options: options)
    outputBus = try AUAudioUnitBus(format: self.format)
    outputBus?.maximumChannelCount = 2
    _outputBusses = AUAudioUnitBusArray(
      audioUnit: self, busType: AUAudioUnitBusType.output, busses: [outputBus!])
    processHelper = GenericAUProcessHelper(&kernel)
    // portal.setMidiDestinationFn({ [weak self] (bytes: [UInt8]) in
    //   self?.pushScheduledMidiEvent(bytes)
    // })
  }

  public override func supportedViewConfigurations(
    _ availableViewConfigurations: [AUAudioUnitViewConfiguration]
  ) -> IndexSet {
    return IndexSet(integersIn: 0..<availableViewConfigurations.count)
  }

  func pullRTAudioPortalEventOne() -> AudioUnitPortalEvent? {
    var rawEvent = LowLevelPortalEvent()
    guard processHelper?.popLowLevelPortalEvent(&rawEvent) == true else {
      return nil
    }
    return mapPortalEventFromRaw(rawEvent)
  }

  //push MIDI note sent from internal UI
  func pushScheduledMidiEvent(_ bytes: [UInt8]) {
    guard let midiBlock = scheduleMIDIEventBlock else { return }
    midiBlock(
      AUEventSampleTimeImmediate, 0, Int(bytes.count), bytes
    )
  }

  func setupPluginCore(_ pluginCore: AUv3PluginCore) {
    // logger.log("setupPluginCore")
    self.pluginCore = pluginCore
    let dspCore = pluginCore.getDSPCore()
    kernel.setDSPCore(&dspCore.pointee)
    self.setupParameterTree(pluginCore.parameterTree)
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
    // logger.log("setupParameterTree")
    self.parameterTree = parameterTree

    let maxAddress = parameterTree.allParameters.map { $0.address }.max() ?? 0
    let capacity64 = maxAddress &+ 1
    let capacity = UInt32(min(capacity64, UInt64(UInt32.max)))
    // logger.log(
    //   "Setting parameter capacity to \(capacity) based on max parameter address \(maxAddress)")
    kernel.setParameterCapacity(capacity)

    // Set the Parameter default values before setting up the parameter callbacks
    for param in parameterTree.allParameters {
      if (param.address < 5 || 30 <= param.address) && false {
        logger.log(
          "route parameterTree default value to kernel: \(param.address) \(param.identifier) \(param.value)"
        )
      }

      kernel.setParameter(param.address, param.value)
    }

    setupParameterCallbacks()
  }

  private func setupParameterCallbacks() {
    // implementorValueObserver is called when a parameter changes value.
    parameterTree?.implementorValueObserver = { [weak self] param, value -> Void in
      // logger.log(
      //   "notified ParamChanged @implementorValueObserver: \(param.address) \(param.identifier) to \(value)"
      // )
      if (param.address < 5 || 30 <= param.address) && false {
        logger.log(
          "notified ParamChanged @implementorValueObserver: \(param.address) \(param.identifier) to \(value)"
        )
      }
      self?.kernel.setParameter(param.address, value)
    }

    // implementorValueProvider is called when the value needs to be refreshed.
    parameterTree?.implementorValueProvider = { [weak self] param in
      let value = self!.kernel.getParameter(param.address)
      if (param.address < 5 || 30 <= param.address) && false {
        logger.log(
          "ParamGet @implementorValueProvider: \(param.address) \(param.identifier) is \(value)")
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

  func emitParametersState() -> (parametersVersion: Int, parameters: [String: Float]) {
    let parametersVersion = self.pluginCore?.parametersMigrator?.latestParametersVersion ?? 0
    var rawParameters: [String: Float] = [:]
    parameterTree?.allParameters.forEach { param in
      rawParameters[param.identifier] = param.value
    }
    return (parametersVersion, rawParameters)
  }

  func applyParametersState(
    _ parametersVersion: Int, _ parameters: [String: Float]
  ) {
    var modParameters = parameters
    self.pluginCore?.parametersMigrator?.migrateParametersIfNeeded(
      paramVer: parametersVersion, rawParameters: &modParameters)
    parameterTree?.allParameters.forEach { param in
      if let value = modParameters[param.identifier] {
        if (param.address < 5 || 30 <= param.address) && false {
          logger.log("SetParam @applyParametersState \(param.address) \(param.identifier) \(value)")
        }
        param.value = value
      }
    }
    self.currentPresetParametersVersion = parametersVersion
    kernel.setParametersVersion(Int32(parametersVersion))
  }

  // var firstFullStateRestorationCalled = false

  public override var fullState: [String: Any]? {
    get {
      logger.mark("fullSaving saving")
      let baseState = super.fullState
      // logger.log("baseVersion: \(baseState?["version"] ?? "nil")")
      var state: [String: Any] = [
        "type": componentDescription.componentType,
        "subtype": componentDescription.componentSubType,
        "manufacturer": componentDescription.componentManufacturer,
        "version": baseState?["version"] as? Int ?? 0,
      ]
      state["kvsItems"] = stateKvs.items
      let (parametersVersion, parameters) = emitParametersState()
      state["parametersVersion"] = parametersVersion
      state["parameters"] = parameters
      return state
    }

    set(newValue) {
      // if !firstFullStateRestorationCalled {
      //   logger.mark("First fullState restoration")
      //   firstFullStateRestorationCalled = true
      // }
      logger.mark("fullState restoration")
      guard let state = newValue else { return }
      // logger.log("Restoring state data: \(state)")
      if let flag = state["MySynth1.hostedInStandaloneApp"] as? Bool {
        // logger.log("received hostedInStandaloneApp flag: \(flag)")
        self.isHostedInStandaloneApp = flag
      }
      if let parametersVersion = state["parametersVersion"] as? Int,
        let parameters = state["parameters"] as? [String: Float]
      {
        applyParametersState(parametersVersion, parameters)
      }
      if let kvsItems = state["kvsItems"] as? [String: String] {
        // logger.log("kvsItems to restore: \(kvsItems)")
        stateKvs.setItems(kvsItems)
      }
      //skipping super.fullState to avoid overwriting our custom restoration results.
      // super.fullState = state
    }
  }

}
