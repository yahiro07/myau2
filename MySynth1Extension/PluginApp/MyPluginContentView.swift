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
      // Text("myau2Extension 0006")
      LocalWebView { webViewIo in
        #if DEBUG
          webViewIo.loadURL("http://localhost:3000?debug=1")
          let folder = WebViewHelper.getWebFolderPrioritized("www_dev", "www")
        // webViewIo.loadURL("app://\(folder)/index.html?debug=1")
        #else
          webViewIo.loadURL("app://www/index.html")
        #endif
        webViewHub.bindWebViewIo(webViewIo)
      }
    }.border(.green, width: 2).ignoresSafeArea()
  }
}
