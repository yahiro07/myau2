import Combine

@MainActor
protocol WebViewIoProtocol {
  func loadURL(_ urlString: String)

  func sendMessage(_ message: String)
  @discardableResult
  func subscribeMessage(_ receiver: @escaping (String) -> Void)
    -> AnyCancellable
}
