import CoreAudioKit

typealias ParamId = UInt64

protocol ParameterServiceProtocol {
  func subscribeParameterChanges(_ listener: ((_ paramKey: String, _ value: Float) -> Void)?)
    -> Int
  func unsubscribeParameterChanges(_ token: Int)
  func setParameterEditState(_ paramKey: String, _ editing: Bool)
  func setParameterEditValue(_ paramKey: String, _ value: Float)
  func getAllParameterValues() -> [String: Float]
}

class ParametersService: ParameterServiceProtocol {
  private let parameterTree: AUParameterTree
  private var observerToken: AUParameterObserverToken?
  private var listeners: [Int: (_ paramKey: String, _ value: Float) -> Void] = [:]
  private var nextListenerToken = 0

  init(parameterTree: AUParameterTree) {
    self.parameterTree = parameterTree
  }

  private func getParamIdByParamKey(_ paramKey: String) -> ParamId? {
    return parameterTree.allParameters.first(where: { $0.identifier == paramKey })?.address
  }

  private func getParamKeyByParamId(_ paramId: ParamId) -> String? {
    return parameterTree.parameter(withAddress: paramId)?.identifier
  }

  private func getAuParameterByParamKey(_ paramKey: String) -> AUParameter? {
    return parameterTree.allParameters.first(where: { $0.identifier == paramKey })
  }

  private func startObserve() {
    observerToken = parameterTree.token(byAddingParameterObserver: { [weak self] paramId, value in
      guard let paramKey = self?.getParamKeyByParamId(paramId) else { return }
      self?.listeners.values.forEach { $0(paramKey, value) }
    })
  }

  private func stopObserve() {
    if observerToken != nil {
      parameterTree.removeParameterObserver(observerToken!)
      observerToken = nil
    }
  }

  func subscribeParameterChanges(_ listener: ((_ paramKey: String, _ value: Float) -> Void)?)
    -> Int
  {
    let token = nextListenerToken
    nextListenerToken += 1
    listeners[token] = listener
    if listeners.count == 1 {
      startObserve()
    }
    return token
  }

  func unsubscribeParameterChanges(_ token: Int) {
    listeners.removeValue(forKey: token)
    if listeners.count == 0 {
      stopObserve()
    }
  }

  func setParameterEditState(_ paramKey: String, _ editing: Bool) {
    guard let parameter = getAuParameterByParamKey(paramKey) else { return }
    parameter.setValue(
      parameter.value, originator: observerToken, atHostTime: 0,
      eventType: editing
        ? AUParameterAutomationEventType.touch : AUParameterAutomationEventType.release)
  }

  func setParameterEditValue(
    _ paramKey: String, _ value: Float
  ) {
    guard let parameter = getAuParameterByParamKey(paramKey) else { return }
    parameter.setValue(
      value, originator: observerToken, atHostTime: 0,
      eventType: AUParameterAutomationEventType.value)
  }

  func getAllParameterValues() -> [String: Float] {
    return parameterTree.allParameters.reduce(into: [:]) { dict, parameter in
      dict[parameter.identifier] = parameter.value
    }
  }
}
