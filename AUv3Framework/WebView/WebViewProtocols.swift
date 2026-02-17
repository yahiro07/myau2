import Combine

public protocol WebViewIoProtocol {
  func sendRawMessageToUI(data: JsDataDictionary)
  @discardableResult
  func subscribeRawMessageFromUI(receiver: @escaping (JsDataDictionary) -> Void)
    -> AnyCancellable
}
