class StateKvs {
  private(set) var items: [String: String] = [:]

  func setItems(_ items: [String: String]) {
    self.items = items
  }

  func read(_ key: String) -> String? {
    return items[key]
  }

  func write(_ key: String, _ value: String) {
    items[key] = value
  }

  func delete(_ key: String) {
    items.removeValue(forKey: key)
  }
}
