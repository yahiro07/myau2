import Combine

public protocol WebViewIoProtocol {
  func loadURL(_ urlString: String)

  func sendRawMessageToUI(data: JsDataDictionary)
  @discardableResult
  func subscribeRawMessageFromUI(receiver: @escaping (JsDataDictionary) -> Void)
    -> AnyCancellable
}
