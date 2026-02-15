import Combine
import SwiftUI
import WebKit

typealias JsDataDictionary = [String: Any]

private class ScriptMessageHandler: NSObject, WKScriptMessageHandler {
  let handler: (JsDataDictionary) -> Void

  init(handler: @escaping (JsDataDictionary) -> Void) {
    self.handler = handler
  }

  func userContentController(
    _ userContentController: WKUserContentController, didReceive message: WKScriptMessage
  ) {
    if let jsDataDictionary = message.body as? JsDataDictionary {
      handler(jsDataDictionary)
    } else {
      logger.log("Invalid message body type: \(type(of: message.body))")
    }
  }
}

private func serializeDictionaryToJsonString(_ dict: [String: Any]) -> String {
  let data = try! JSONSerialization.data(withJSONObject: dict as Any, options: [])
  return String(data: data, encoding: .utf8)!
}

private func sendMessageToWebViewRaw(webView: WKWebView, jsDataDictionary: JsDataDictionary) {
  let jsStringifiedData = serializeDictionaryToJsonString(jsDataDictionary)
  logger.log("sending message to UI: \(jsStringifiedData)")
  //window.putMessageFromApp()を呼び出す
  let jsCode =
    "window.putMessageFromApp && window.putMessageFromApp(\(jsStringifiedData));"
  webView.evaluateJavaScript(jsCode)
}

final class WebViewCoordinator: NSObject, WebViewIoProtocol {
  weak var webView: WKWebView?
  private var receivers: [UUID: (JsDataDictionary) -> Void] = [:]
  private var didCallOnBind = false

  func callOnBindIfNeeded(_ onBind: (WebViewIoProtocol) -> Void) {
    guard !didCallOnBind else { return }
    didCallOnBind = true
    onBind(self)
  }

  func dispatchFromUI(_ dict: JsDataDictionary) {
    receivers.values.forEach { $0(dict) }
  }

  func sendRawMessageToUI(data: JsDataDictionary) {
    guard let webView else { return }
    sendMessageToWebViewRaw(webView: webView, jsDataDictionary: data)
  }

  @discardableResult
  func subscribeRawMessageFromUI(receiver: @escaping (JsDataDictionary) -> Void)
    -> AnyCancellable
  {
    let id = UUID()
    return AnyCancellable { [weak self] in
      self?.receivers.removeValue(forKey: id)
    }
  }
}

#if os(macOS)
  struct LocalWebView: NSViewRepresentable {
    let onBind: (WebViewIoProtocol) -> Void

    init(_ onBind: @escaping (WebViewIoProtocol) -> Void) {
      self.onBind = onBind
    }

    func makeCoordinator() -> WebViewCoordinator { WebViewCoordinator() }

    func makeNSView(context: Context) -> WKWebView {
      let config = WKWebViewConfiguration()
      config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
      let userContentController: WKUserContentController = WKUserContentController()
      config.userContentController = userContentController

      let webView = WKWebView(frame: .zero, configuration: config)
      if #available(macOS 13.3, *) { webView.isInspectable = true }

      userContentController.add(
        ScriptMessageHandler { [weak coordinator = context.coordinator] dict in
          coordinator?.dispatchFromUI(dict)
        },
        name: "putMessageFromUI"
      )

      loadPage(webView)
      return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
      context.coordinator.webView = webView
      context.coordinator.callOnBindIfNeeded(onBind)
    }

    func loadPage(_ webView: WKWebView) {
      guard
        let url = Bundle.main.url(
          forResource: "index", withExtension: "html", subdirectory: "dist")
      else { return }
      print("load url: \(url)")
      webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

  }

#elseif os(iOS)

  struct LocalWebView: UIViewRepresentable {
    // iOSではUIViewRepresentableを使用

    func makeUIView(context: Context) -> WKWebView {
      let config = WKWebViewConfiguration()
      config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

      let webView = WKWebView(frame: .zero, configuration: config)

      loadPage(webView)
      return webView
    }

    func loadPage(_ webView: WKWebView) {
      guard
        let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist")
      else {
        print("Invalid URL")
        return
      }
      print("Load URL: \(url)")
      webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

    func updateUIView(_ webView: WKWebView, context: Context) {

    }

  }
#endif
