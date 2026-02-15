enum PresetType {
  case factory
  case user
}
struct PresetItem {
  let id: String
  let name: String
  let type: PresetType
}

protocol PresetManager {
  func listPresetItems() -> [PresetItem]
  func loadPreset(id: String)
  func saveUserPreset(name: String) -> String?  //idを返す
}

class PresetManagerImpl: PresetManager {
  func listPresetItems() -> [PresetItem] {
    return []
  }
  func loadPreset(id: String) {}
  func saveUserPreset(name: String) -> String? { return nil }
}
