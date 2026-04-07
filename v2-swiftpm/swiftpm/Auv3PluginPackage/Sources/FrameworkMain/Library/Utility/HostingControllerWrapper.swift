import CoreAudioKit
import Foundation
import SwiftUI

#if os(iOS) || os(visionOS)
  typealias HostingController = UIHostingController
#elseif os(macOS)
  typealias HostingController = NSHostingController

  extension NSView {

    func bringSubviewToFront(_ view: NSView) {
      // This function is a no-opp for macOS
    }
  }
#endif

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
