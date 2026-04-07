class ParameterStore {
  private var parameterValues: [UInt64: Float] = [:]
  private var canAcceptNewKey = true

  func stateKnownKeysInserted() {
    canAcceptNewKey = false
  }

  func get(_ address: UInt64) -> Float {
    return parameterValues[address] ?? 0.0
  }

  func set(_ address: UInt64, _ value: Float) {
    if !canAcceptNewKey && parameterValues[address] == nil { return }
    parameterValues[address] = value
  }
}
