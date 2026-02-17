import AUv3Framework
import SwiftUI

struct MyPluginContentView: View {
  let webViewHub: BasicWebViewHub

  init(
    _ viewAccessibleResources: ViewAccessibleResources
  ) {
    self.webViewHub = BasicWebViewHub(viewAccessibleResources)
  }

  var body: some View {
    VStack {
      Text("myau2Extension 0006")
      LocalWebView { handle in
        webViewHub.bindWebViewIo(webViewIo: handle)
      }
    }.border(.green, width: 2).ignoresSafeArea()
  }
}
