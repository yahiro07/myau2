import Combine
import SwiftUI
import WebKit

public typealias JsDataDictionary = [String: Any]

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
      logger.warn("Invalid message body type: \(type(of: message.body))")
    }
  }
}

private func serializeDictionaryToJsonString(_ dict: [String: Any]) -> String {
  let data = try! JSONSerialization.data(withJSONObject: dict as Any, options: [])
  return String(data: data, encoding: .utf8)!
}

private func sendMessageToWebViewRaw(webView: WKWebView, jsDataDictionary: JsDataDictionary) {
  let jsStringifiedData = serializeDictionaryToJsonString(jsDataDictionary)
  // logger.log("sending message to UI: \(jsStringifiedData)")
  //window.putMessageFromApp()を呼び出す
  let jsCode =
    "window.putMessageFromApp && window.putMessageFromApp(\(jsStringifiedData));"
  webView.evaluateJavaScript(jsCode)
}

public class WebViewCoordinator: NSObject, WebViewIoProtocol {
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

  public func sendRawMessageToUI(data: JsDataDictionary) {
    guard let webView else { return }
    sendMessageToWebViewRaw(webView: webView, jsDataDictionary: data)
  }

  @discardableResult
  public func subscribeRawMessageFromUI(receiver: @escaping (JsDataDictionary) -> Void)
    -> AnyCancellable
  {
    let id = UUID()
    receivers[id] = receiver
    return AnyCancellable { [weak self] in
      self?.receivers.removeValue(forKey: id)
    }
  }
}

class MySchemeHandler: NSObject, WKURLSchemeHandler {

  func webView(
    _ webView: WKWebView,
    start urlSchemeTask: WKURLSchemeTask
  ) {

    guard let url = urlSchemeTask.request.url else { return }

    print("request url:", url.absoluteString)
    print("url.path:", url.path)

    let host = url.host ?? ""
    let path = url.path

    let relativePath = host + path

    let resourceURL = Bundle.main.resourceURL!
    let fileURL = resourceURL.appendingPathComponent(relativePath)

    print("Loading:", fileURL.path)

    guard let data = try? Data(contentsOf: fileURL) else {
      logger.error("Failed to load file for URL: \(url), path: \(path)")
      urlSchemeTask.didFailWithError(NSError(domain: "file", code: 404))
      return
    }

    let response = HTTPURLResponse(
      url: url,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "Content-Type": mimeType(for: fileURL.path),
        "Content-Length": "\(data.count)",
      ]
    )!

    urlSchemeTask.didReceive(response)
    urlSchemeTask.didReceive(data)
    urlSchemeTask.didFinish()
  }

  func webView(
    _ webView: WKWebView,
    stop urlSchemeTask: WKURLSchemeTask
  ) {
  }

  private func mimeType(for path: String) -> String {
    if path.hasSuffix(".html") { return "text/html" }
    if path.hasSuffix(".js") { return "application/javascript" }
    if path.hasSuffix(".css") { return "text/css" }
    if path.hasSuffix(".json") { return "application/json" }
    return "application/octet-stream"
  }
}

func commonWebViewSetup(
  coordinator: WebViewCoordinator, onBind: @escaping (WebViewIoProtocol) -> Void
) -> WKWebView {
  let config = WKWebViewConfiguration()

  config.setURLSchemeHandler(MySchemeHandler(), forURLScheme: "app")

  let userContentController: WKUserContentController = WKUserContentController()
  userContentController.add(
    ScriptMessageHandler { [weak coordinator] dict in
      coordinator?.dispatchFromUI(dict)
    },
    name: "putMessageFromUI"
  )
  config.userContentController = userContentController

  let webView = WKWebView(frame: .zero, configuration: config)
  webView.isInspectable = true

  coordinator.webView = webView

  if false {
    let url = URL(string: "app://www/index.html")!
    webView.load(URLRequest(url: url))
  } else {
    // For debugging: load from localhost
    let url = URL(string: "http://localhost:3000")!
    webView.load(URLRequest(url: url))
  }

  coordinator.callOnBindIfNeeded(onBind)

  return webView
}

#if os(macOS)
  public struct LocalWebView: NSViewRepresentable {
    let onBind: (WebViewIoProtocol) -> Void

    public init(_ onBind: @escaping (WebViewIoProtocol) -> Void) {
      self.onBind = onBind
    }

    public func makeCoordinator() -> WebViewCoordinator { WebViewCoordinator() }

    public func makeNSView(context: Context) -> WKWebView {
      return commonWebViewSetup(coordinator: context.coordinator, onBind: onBind)
    }

    public func updateNSView(_ webView: WKWebView, context: Context) {
    }

  }

#elseif os(iOS)
  // iOSではUIViewRepresentableを使用
  public struct LocalWebView: UIViewRepresentable {

    let onBind: (WebViewIoProtocol) -> Void

    public init(_ onBind: @escaping (WebViewIoProtocol) -> Void) {
      self.onBind = onBind
    }

    public func makeCoordinator() -> WebViewCoordinator { WebViewCoordinator() }

    public func makeUIView(context: Context) -> WKWebView {
      return commonWebViewSetup(coordinator: context.coordinator, onBind: onBind)
    }

    public func updateUIView(_ webView: WKWebView, context: Context) {
    }

  }
#endif
