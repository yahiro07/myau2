import Combine
import CoreAudioKit
import SwiftUI
import os

private let log = Logger(
  subsystem: "net.miqsel.synth2511.myau2Extension", category: "AudioUnitViewController")

open class GenericAudioUnitViewController: AUViewController {
  private var audioUnit: GenericAudioUnit?
  private var hostingController: HostingController<AnyView>?
  // private var observation: NSKeyValueObservation?

  private let audioUnitPortal: AudioUnitPortalImpl = AudioUnitPortalImpl()
  private let presetFilesIO: PresetFilesIOImpl = PresetFilesIOImpl()

  deinit {
  }

  nonisolated public func createAudioUnitInternal(
    with componentDescription: AudioComponentDescription,
    pluginCore: AUv3PluginCore
  )
    throws -> AUAudioUnit
  {
    return try DispatchQueue.main.sync {
      logger.log("⏬createAudioUnitInternal")

      let audioUnit = try GenericAudioUnit(
        componentDescription: componentDescription, options: [])
      self.audioUnit = audioUnit

      try presetFilesIO.debugLogDataLocation()

      audioUnit.setupPluginCore(pluginCore)

      self.audioUnitPortal.setAudioUnit(audioUnit)

      defer {
        // Configure the SwiftUI view after creating the AU, instead of in viewDidLoad,
        // so that the parameter tree is set up before we build our @AUParameterUI properties
        DispatchQueue.main.async {
          self.configureSwiftUIView()
        }
      }

      // self.observation = audioUnit.observe(\.allParameterValues, options: [.new]) {
      //   object, change in
      //   guard let tree = audioUnit.parameterTree else { return }

      //   // This insures the Audio Unit gets initial values from the host.
      //   for param in tree.allParameters { param.value = param.value }
      // }

      // guard audioUnit.parameterTree != nil else {
      //   log.error("Unable to access AU ParameterTree")
      //   return audioUnit
      // }

      return audioUnit
    }
  }

  //not invoked after init?
  public override func viewDidLoad() {
    logger.log("viewDidLoad")
    super.viewDidLoad()
    // self.preferredContentSize = CGSize(width: 1080, height: 600)
    configureSwiftUIView()
  }

  #if os(iOS)
    public override func viewWillTransition(
      to size: CGSize,
      with coordinator: UIViewControllerTransitionCoordinator
    ) {
      super.viewWillTransition(to: size, with: coordinator)
      print("Resizing to:", size)
    }
  #endif

  private func configureSwiftUIView() {
    logger.log("⏬configureSwiftUIView")

    if let host = hostingController {
      host.removeFromParent()
      host.view.removeFromSuperview()
    }
    guard let audioUnit = self.audioUnit,
      let observableParameterTree = audioUnit.observableParameterTree,
      let pluginCore = audioUnit.pluginCore
    else {
      return
    }

    let parameterMigrator = pluginCore.parametersMigrator
    let viewAccessibleResources = ViewAccessibleResources(
      parameterTree: observableParameterTree, audioUnitPortal: self.audioUnitPortal,
      presetFilesIO: self.presetFilesIO, parametersMigrator: parameterMigrator,
      stateKvs: audioUnit.stateKvs)

    // logger.log("now call pluginCore.createView")
    let content = pluginCore.createView(viewAccessibleResources)
    let host = HostingController(rootView: content)
    // host.sizingOptions = .preferredContentSize

    self.addChild(host)
    host.view.frame = self.view.bounds
    self.view.addSubview(host.view)
    hostingController = host

    // Make sure the SwiftUI view fills the full area provided by the view controller
    host.view.translatesAutoresizingMaskIntoConstraints = false
    host.view.topAnchor.constraint(equalTo: self.view.topAnchor).isActive = true
    host.view.leadingAnchor.constraint(equalTo: self.view.leadingAnchor).isActive = true
    host.view.trailingAnchor.constraint(equalTo: self.view.trailingAnchor).isActive = true
    host.view.bottomAnchor.constraint(equalTo: self.view.bottomAnchor).isActive = true
    self.view.bringSubviewToFront(host.view)

    // logger.log("finished configureSwiftUIView")
  }

  #if os(macOS)
    override public func viewDidAppear() {
      super.viewDidAppear()
      startEventLoop()
    }

    override public func viewWillDisappear() {
      super.viewWillDisappear()
      stopEventLoop()
    }
  #elseif os(iOS)
    override public func viewDidAppear(_ animated: Bool) {
      super.viewDidAppear(animated)
      startEventLoop()
    }

    override public func viewWillDisappear(_ animated: Bool) {
      super.viewWillDisappear(animated)
      stopEventLoop()
    }
  #endif

  // private var displayLink: CADisplayLink?
  // func startEventLoop() {
  //   // displayLink = self.view.displayLink(target: self, selector: #selector(displayLinkFired))
  //   // displayLink?.isPaused = false
  //   displayLink = CVDisplayLink { [weak self] _ in
  //     self?.displayLinkTick()
  //   }
  //   displayLink?.add(to: .main, forMode: .common)
  // }
  // private func stopEventLoop() {
  //   displayLink?.invalidate()
  //   displayLink = nil
  // }
  // @objc private func displayLinkFired() {
  //   guard let portalImpl = audioUnit?.getPortalImpl() else { return }
  //   portalImpl.drainEventsOnMainThread(maxCount: 32)
  // }

  private var eventTimer: Timer?
  private var cancellables = Set<AnyCancellable>()

  private func startEventLoop() {
    eventTimer = Timer(
      timeInterval: 1.0 / 60.0,
      repeats: true
    ) { [weak self] _ in
      self?.audioUnitPortal.drainEventsOnMainThread(maxCount: 32)
    }
    RunLoop.main.add(eventTimer!, forMode: .common)

    //debug
    // if let portal = audioUnit?.portal {
    //   portal.events.sink { event in
    //     logger.log("Received event from AudioUnit: \(event)")
    //   }.store(in: &cancellables)
    // }
  }
  private func stopEventLoop() {
    eventTimer?.invalidate()
    eventTimer = nil
    cancellables.removeAll()
  }

}
