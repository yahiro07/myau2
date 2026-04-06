import Combine
import CoreAudioKit
import SwiftUI
import os

private let log = Logger(
  subsystem: "com.example.sonic.proto-kit-auv3.Project1Extension",
  category: "AudioUnitViewController")

open class PluginAudioUnitViewController: AUViewController, AUAudioUnitFactory {
  var audioUnit: PluginAudioUnit?

  var hostingController: HostingController<PluginMainView>?

  private var observation: NSKeyValueObservation?

  /* iOS View lifcycle
  public override func viewWillAppear(_ animated: Bool) {
  	super.viewWillAppear(animated)
  
  	// Recreate any view related resources here..
  }
  
  public override func viewDidDisappear(_ animated: Bool) {
  	super.viewDidDisappear(animated)
  
  	// Destroy any view related content here..
  }
  */

  /* macOS View lifcycle
  public override func viewWillAppear() {
  	super.viewWillAppear()
  
  	// Recreate any view related resources here..
  }
  
  public override func viewDidDisappear() {
  	super.viewDidDisappear()
  
  	// Destroy any view related content here..
  }
  */

  public override func viewDidLoad() {
    super.viewDidLoad()

    // Accessing the `audioUnit` parameter prompts the AU to be created via createAudioUnit(with:)
    guard let audioUnit = self.audioUnit else {
      return
    }
    configureSwiftUIView(audioUnit: audioUnit)
  }

  nonisolated public func createAudioUnit(with componentDescription: AudioComponentDescription)
    throws -> AUAudioUnit
  {
    print("createAudioUnit 1903")

    return try DispatchQueue.main.sync {

      audioUnit = try PluginAudioUnit(
        componentDescription: componentDescription, options: [])

      guard let audioUnit = self.audioUnit else {
        log.error("Unable to create Project1ExtensionAudioUnit")
        return audioUnit!
      }

      defer {
        // Configure the SwiftUI view after creating the AU, instead of in viewDidLoad,
        // so that the parameter tree is set up before we build our @AUParameterUI properties
        DispatchQueue.main.async {
          self.configureSwiftUIView(audioUnit: audioUnit)
        }
      }

      audioUnit.setupParameterTree(Project1ExtensionParameterSpecs.createAUParameterTree())

      self.observation = audioUnit.observe(\.allParameterValues, options: [.new]) {
        object, change in
        guard let tree = audioUnit.parameterTree else { return }

        // This insures the Audio Unit gets initial values from the host.
        for param in tree.allParameters { param.value = param.value }
      }

      guard audioUnit.parameterTree != nil else {
        log.error("Unable to access AU ParameterTree")
        return audioUnit
      }

      return audioUnit
    }
  }

  private func configureSwiftUIView(audioUnit: PluginAudioUnit) {
    if let host = hostingController {
      host.removeFromParent()
      host.view.removeFromSuperview()
    }

    guard let controllerFacade = audioUnit.controllerFacade else { return }
    let content = PluginMainView(controllerFacade)
    let host = HostingController(rootView: content)
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

    audioUnit.viewAdded()
  }

  deinit {
    audioUnit?.viewRemoved()
  }
}
