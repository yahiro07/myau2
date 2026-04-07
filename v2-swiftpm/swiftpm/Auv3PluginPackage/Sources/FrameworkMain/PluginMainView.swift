import SwiftUI

struct PluginMainView: View {
  @StateObject private var webViewBridge: WebViewBridge

  init(_ controllerFacade: ControllerFacadeProtocol) {
    _webViewBridge = StateObject(wrappedValue: WebViewBridge(controllerFacade))
  }

  var body: some View {
    VStack {
      WebViewComponent { webViewIo in
        webViewIo.loadURL("http://localhost:3000?debug=1")
        // webViewIo.loadURL("app://www-bundles/index.html")
        webViewBridge.bindWebView(webViewIo)
      }.onDisappear {
        webViewBridge.unbindWebView()
      }
    }
    .border(.green, width: 2)
    .ignoresSafeArea()
  }
}
