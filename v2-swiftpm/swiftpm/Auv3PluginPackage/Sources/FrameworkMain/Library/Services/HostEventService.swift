class HostEventService {
  private var listeners: [Int: (_ event: HostEvent) -> Void] = [:]
  private var nextListenerToken = 0

  func subscribe(_ listener: ((_ event: HostEvent) -> Void)?) -> Int {
    let token = nextListenerToken
    nextListenerToken += 1
    listeners[token] = listener
    return token
  }

  func unsubscribe(_ token: Int) {
    listeners.removeValue(forKey: token)
  }

  func emitHostEvent(_ event: HostEvent) {
    listeners.values.forEach { $0(event) }
  }
}
