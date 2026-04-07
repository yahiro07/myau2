import CoreAudioKit
import SwiftUI

private func osTypeString(_ value: Int) -> String {
  let n = Int(value)
  var s = ""
  for i in (0..<4).reversed() {
    let shift = i * 8
    let char = UnicodeScalar((n >> shift) & 0xFF)!
    s.append(Character(char))
  }
  return s
}

func showEntryInfo(_ componentDescription: AudioComponentDescription) {
  let bundlePath = Bundle.main.bundlePath
  let bundleID = Bundle.main.bundleIdentifier ?? "unknown"
  let type = osTypeString(Int(componentDescription.componentType))
  let subType = osTypeString(Int(componentDescription.componentSubType))
  let manufacturer = osTypeString(Int(componentDescription.componentManufacturer))
  logger.log("Loaded From: \(bundlePath)")
  logger.log("Bundle ID: \(bundleID)")
  logger.log("Type: \(type), SubType: \(subType), Manufacturer: \(manufacturer)")
}

class HostingControllerWrapper {
  private var hostingController: HostingController<AnyView>?

  @MainActor
  func bindView(vc: AUViewController, content: AnyView) {
    if let host = hostingController {
      host.removeFromParent()
      host.view.removeFromSuperview()
    }

    let host = HostingController(rootView: content)
    vc.addChild(host)
    host.view.frame = vc.view.bounds
    vc.view.addSubview(host.view)
    hostingController = host

    // Make sure the SwiftUI view fills the full area provided by the view controller
    host.view.translatesAutoresizingMaskIntoConstraints = false
    host.view.topAnchor.constraint(equalTo: vc.view.topAnchor).isActive = true
    host.view.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor).isActive = true
    host.view.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor).isActive = true
    host.view.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor).isActive = true
    vc.view.bringSubviewToFront(host.view)
  }
}
