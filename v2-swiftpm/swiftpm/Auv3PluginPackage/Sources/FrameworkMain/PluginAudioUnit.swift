import AVFoundation
import DspRoute

public class PluginAudioUnit: AUAudioUnit, @unchecked Sendable {
  // C++ Objects
  var kernel = PluginDSPKernel()
  var processHelper: AUProcessHelper?

  private var outputBus: AUAudioUnitBus?
  private var _outputBusses: AUAudioUnitBusArray!

  private var format: AVAudioFormat

  private let hostEventService = HostEventService()
  private var parametersService: ParametersService?
  private let internalNoteService = InternalNoteService()
  private let storageFileIoService = StorageFileIoService()
  private let stateKvsService = StateKvsService()
  private(set) var controllerFacade: ControllerFacade?

  private let intervalTimer = IntervalTimer()
  private var viewCount = 0

  @objc override init(
    componentDescription: AudioComponentDescription, options: AudioComponentInstantiationOptions
  ) throws {
    self.format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2)!
    try super.init(componentDescription: componentDescription, options: options)
    outputBus = try AUAudioUnitBus(format: self.format)
    outputBus?.maximumChannelCount = 2
    _outputBusses = AUAudioUnitBusArray(
      audioUnit: self, busType: AUAudioUnitBusType.output, busses: [outputBus!])
    processHelper = AUProcessHelper(&kernel)
    internalNoteService.setDestinationFn { noteNumber, velocity in
      self.kernel.pushInternalNote(Int32(noteNumber), velocity)
    }
    self.setupParameterTree()
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
    return kernel.AudioUnitMIDIProtocol()
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

  private func setupParameterTree() {
    let parameterTree = buildPluginParameterSpecs().createAUParameterTree()
    let parametersService = ParametersService(parameterTree: parameterTree)
    self.parameterTree = parameterTree
    self.parametersService = parametersService
    self.controllerFacade = ControllerFacade(
      parametersService: parametersService,
      hostEventService: hostEventService, internalNoteService: internalNoteService,
      storageFileIoService: storageFileIoService, stateKvsService: stateKvsService)

    setupParameterStore(parameterTree)
  }

  private func setupParameterStore(_ parameterTree: AUParameterTree) {
    let parameterStore = ParameterStore()

    for param in parameterTree.allParameters {
      parameterStore.set(param.address, param.value)
      kernel.setParameter(param.address, param.value)
    }
    parameterStore.stateKnownKeysInserted()

    parameterTree.implementorValueObserver = { [weak self] param, value -> Void in
      // logger.log("parameter changed: \(param.address) \(value)")
      parameterStore.set(param.address, value)
      self?.kernel.pushParameterChange(param.address, value)
    }
    parameterTree.implementorValueProvider = { param in
      parameterStore.get(param.address)
    }
    parameterTree.implementorStringFromValueCallback = { param, valuePtr in
      guard let value = valuePtr?.pointee else {
        return "-"
      }
      return NSString.localizedStringWithFormat("%.f", value) as String
    }
  }

  public override var fullState: [String: Any]? {
    get {
      logger.log("fullState saving")
      let baseState = super.fullState
      var state: [String: Any] = [
        "type": componentDescription.componentType,
        "subtype": componentDescription.componentSubType,
        "manufacturer": componentDescription.componentManufacturer,
        "version": baseState?["version"] as? Int ?? 0,
      ]
      state["kvsItems"] = stateKvsService.getItems()
      let parameters = parametersService!.getAllParameterValues()
      state["parameters"] = parameters
      return state
    }

    set(newValue) {
      logger.log("fullState restoration")
      guard let state = newValue else { return }
      // if let flag = state["MySynth1.hostedInStandaloneApp"] as? Bool {
      //   self.isHostedInStandaloneApp = flag
      // }
      if let parameters = state["parameters"] as? [String: Float] {
        parametersService!.loadFullParametersSuit(parameters)
      }
      if let kvsItems = state["kvsItems"] as? [String: String] {
        stateKvsService.setItems(kvsItems)
      }
      //skipping super.fullState to avoid overwriting our custom restoration results.
      // super.fullState = state
    }
  }

  func drainHostEvents() {
    var rawEvent = RtHostEvent()
    while kernel.popRtHostEvent(&rawEvent) {
      if let event = mapHostEventFromRtHostEvent(rawEvent) {
        hostEventService.emitHostEvent(event)
      }
    }
  }

  func onIntervalTimerTick() {
    drainHostEvents()
  }

  func viewAdded() {
    viewCount += 1
    if viewCount == 1 {
      intervalTimer.start(intervalMs: 16, callback: onIntervalTimerTick)
    }
  }
  func viewRemoved() {
    viewCount -= 1
    if viewCount == 0 {
      intervalTimer.stop()
    }
  }
}
