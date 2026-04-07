protocol ParameterStoreProtocol {
  func stateKnownKeysInserted()
  func set(_ address: UInt64, _ value: Float)
  func get(_ address: UInt64) -> Float
}

final class VectorParameterStore: ParameterStoreProtocol, @unchecked Sendable {
  private var parameterValues: [Float] = []

  init(_ capacity: Int) {
    let clampedCapacity = min((capacity), 4096)
    parameterValues = Array(repeating: 0, count: clampedCapacity)
  }

  func stateKnownKeysInserted() {}

  func get(_ address: UInt64) -> Float {
    let index = Int(address)
    guard index >= 0, index < parameterValues.count else {
      return 0
    }
    return parameterValues[index]
  }

  func set(_ address: UInt64, _ value: Float) {
    let index = Int(address)
    guard index >= 0, index < parameterValues.count else {
      return
    }
    parameterValues[index] = value
  }
}

final class DictionaryParameterStore: ParameterStoreProtocol, @unchecked Sendable {
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

func createParameterStore(_ capacity: Int) -> ParameterStoreProtocol {
  if capacity < 4096 {
    return VectorParameterStore(capacity)
  } else {
    return DictionaryParameterStore()
  }
}
