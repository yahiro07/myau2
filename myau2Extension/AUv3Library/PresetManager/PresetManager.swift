enum ParametersVersion: Int {
  case initial = 1
}

enum PresetType {
  case factory
  case user
}
struct PresetItem {
  //example
  //(id: factory:bass1, presetName:Bass 1, fileName: bass1.json)
  //(id: user:eYRAamdt6jALD8VvwsVTJC, presetName:Bass 2, fileName:eYRAamdt6jALD8VvwsVTJC.json)
  //id=filename for factory presets, id=UUID for user presets
  let id: String
  let presetName: String
  let type: PresetType
}

struct PresetsState {
  let items: [PresetItem]
  //現在のパラメタセットがどのプリセットに紐づいているか(=最後に読み込んだプリセットのID)
  //をPresetManager側で保持しておく。上書き保存の可否の判定に使用
  let currentPresetSlotId: String?
}

protocol PresetManager {
  func loadPresetsState() -> PresetsState
  func loadPreset(id: String)
  func savePresetAs(name: String) -> String?  //save current params as a new preset, returns id
  func overwritePreset() -> Bool  //overwrite current preset
  func deletePreset(id: String) -> Bool
  func importFromFile()  //read local file and affect to current params
  func exportToFile()  //write current params to local file
}

typealias SerializedPresetData = String

struct PresetData {
  let parametersVersion: ParametersVersion
  let presetName: String
  let parameters: [String: Float]
}

private class Helper {
  static func getPresetJsonFileName(_ id: String) -> String {
    let parts = id.split(separator: ":")
    guard parts.count == 2 else {
      logger.log("Invalid preset id format: \(id)")
      return ""
    }
    return String(parts[1]) + ".json"
  }

  static func getNamePartOfFileName(_ fileName: String) -> String {
    return String(fileName.split(separator: ".")[0])
  }

  static func serializeDictionaryToJsonString<T>(_ dict: [String: T]) -> String {
    let data = try! JSONSerialization.data(withJSONObject: dict as Any, options: [])
    return String(data: data, encoding: .utf8)!
  }
  static func deserializeDictionaryFromJsonString(_ jsonString: String) -> [String: Any]? {
    if let data = jsonString.data(using: .utf8),
      let dict = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
    {
      return dict
    }
    return nil
  }

  static func serializePresetData(_ presetData: PresetData) -> SerializedPresetData {
    return serializeDictionaryToJsonString([
      "parametersVersion": presetData.parametersVersion.rawValue,
      "presetName": presetData.presetName,
      "parameters": presetData.parameters,
    ])
  }
  static func deserializePresetData(_ serializedData: SerializedPresetData) -> PresetData? {
    if let data = serializedData.data(using: .utf8),
      let dict = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
      let parametersVersionRaw = dict["parametersVersion"] as? Int,
      let parametersVersion = ParametersVersion(rawValue: parametersVersionRaw),
      let presetName = dict["presetName"] as? String,
      let parameters = dict["parameters"] as? [String: Float]
    {
      return PresetData(
        parametersVersion: parametersVersion, presetName: presetName, parameters: parameters)
    }
    return nil
  }

  static func deserializeExtractPresetName(_ serializedData: SerializedPresetData) -> String? {
    if let data = serializedData.data(using: .utf8),
      let dict = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
      let presetName = dict["presetName"] as? String
    {
      return presetName
    }
    return nil
  }
}

class FactoryPresetStorage {

  private func getFileUrl(_ fileName: String) -> URL? {
    return Bundle(for: FactoryPresetStorage.self).url(
      forResource: fileName, withExtension: nil, subdirectory: "presets")
  }

  func listItems() -> [PresetItem] {
    //meta.jsonを読み込んでpresetItemsを構築し,対応するファイルがあるかを確認してないものは省く
    guard let url = getFileUrl("meta.json") else {
      logger.log("Failed get url for preset meta file")
      return []
    }
    do {
      let data = try Data(contentsOf: url)
      guard let jsonString = String(data: data, encoding: .utf8),
        let dict = Helper.deserializeDictionaryFromJsonString(jsonString) as? [String: String]
      else {
        logger.log("Failed to parse factory preset meta file")
        return []
      }

      return dict.compactMap { (fileName, presetName) in
        let namePart = Helper.getNamePartOfFileName(fileName)
        let id = "factory:\(namePart)"

        // ファイルが存在する場合のみPresetItemを返す
        guard let fileUrl = getFileUrl(namePart),
          FileManager.default.fileExists(atPath: fileUrl.path)
        else {
          return nil
        }

        return PresetItem(id: id, presetName: presetName, type: .factory)
      }
    } catch {
      logger.log("Error loading factory preset meta file: \(error)")
      return []
    }
  }
  func loadPresetFile(_ id: String) -> PresetData? {
    let fileName = Helper.getPresetJsonFileName(id)
    if let url = getFileUrl(fileName) {
      do {
        let data = try Data(contentsOf: url)
        if let jsonString = String(data: data, encoding: .utf8) {
          return Helper.deserializePresetData(jsonString)
        }
      } catch {
        logger.log("Error loading factory preset file: \(error)")
      }
    }
    logger.log("Failed to load factory preset file: \(fileName)")
    return nil
  }
}

class SharedContainer1 {
  static let appGroupId = "group.synth2511.myau2"

  static func baseURL() throws -> URL {
    guard
      let url = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId)
    else {
      throw NSError(
        domain: "SharedContainer",
        code: 1,
        userInfo: [
          NSLocalizedDescriptionKey:
            "containerURL is nil. Check App Group entitlement: \(appGroupId)"
        ]
      )
    }
    return url
  }

  static func ensureSubFolder(_ folderName: String) throws -> URL {
    let fm = FileManager.default
    let folderURL = try baseURL().appendingPathComponent(folderName, isDirectory: true)

    var isDir: ObjCBool = false
    if fm.fileExists(atPath: folderURL.path, isDirectory: &isDir) {
      if !isDir.boolValue {
        // 指定されたフォルダ名がファイルとして存在してたら作れないので削除して作り直す
        try fm.removeItem(at: folderURL)
      }
    }

    try fm.createDirectory(at: folderURL, withIntermediateDirectories: true, attributes: nil)
    return folderURL
  }

  static func userPresetFileURL(_ fileName: String) throws -> URL {
    let folderURL = try ensureSubFolder("user_presets")
    return folderURL.appendingPathComponent(fileName, isDirectory: false)
  }
}

class UserPresetStorage {
  func listItems() -> [PresetItem] {
    //全ファイルを列挙してそれぞれ読み込み名前を取り出してpresetItemsを構築する
    do {
      let folderURL = try SharedContainer.ensureSubFolder("user_presets")
      let files = try FileManager.default.contentsOfDirectory(
        at: folderURL, includingPropertiesForKeys: nil)
      var presetItems: [PresetItem] = []
      for file in files {
        let fileName = file.lastPathComponent
        let fileURL = try SharedContainer1.userPresetFileURL(fileName)
        let content = try String(contentsOf: fileURL, encoding: .utf8)
        let presetName = Helper.deserializeExtractPresetName(content)
        if let presetName {
          let namePart = Helper.getNamePartOfFileName(fileName)
          let id = "user:\(namePart)"
          let presetItem = PresetItem(id: id, presetName: presetName, type: .user)
          presetItems.append(presetItem)
        }
      }
      return presetItems
    } catch {
      logger.log("Error listing user preset files: \(error)")
      return []
    }
  }
  func loadPresetFile(_ id: String) -> PresetData? {
    let fileName = Helper.getPresetJsonFileName(id)
    do {
      let fileURL = try SharedContainer1.userPresetFileURL(fileName)
      let content = try String(contentsOf: fileURL, encoding: .utf8)
      logger.log("File content: \(content)")
      return Helper.deserializePresetData(content)
    } catch {
      logger.log("Error loading preset file: \(error)")
    }
    return nil

  }
  func savePresetFile(_ id: String, _ presetData: PresetData) {
    let fileName = Helper.getPresetJsonFileName(id)
    let serializedData = Helper.serializePresetData(presetData)
    do {
      let fileURL = try SharedContainer1.userPresetFileURL(fileName)
      try serializedData.write(to: fileURL, atomically: true, encoding: .utf8)
    } catch {
      logger.log("Error saving preset file: \(error)")
    }

  }
  func deletePresetFile(_ id: String) {
    let fileName = Helper.getPresetJsonFileName(id)
    do {
      let fileURL = try SharedContainer1.userPresetFileURL(fileName)
      try FileManager.default.removeItem(at: fileURL)
    } catch {
      logger.log("Error deleting preset file: \(error)")
    }
  }
}

class PresetAffecter {
  private var parameterTree: AUParameterTree?

  func setParameterTree(_ parameterTree: AUParameterTree) {
    self.parameterTree = parameterTree
  }
  func affectPresetDataToParameters(_ presetData: PresetData) {
    for param in parameterTree?.allParameters ?? [] {
      if let value = presetData.parameters[param.identifier] {
        param.value = value
      }
    }
  }
  func captureCurrentParametersWithName(_ presetName: String) -> PresetData? {
    var parameters: [String: Float] = [:]
    for param in parameterTree?.allParameters ?? [] {
      parameters[param.identifier] = param.value
    }
    return PresetData(
      parametersVersion: .initial,
      presetName: presetName,
      parameters: parameters
    )
  }
}

class PresetManagerImpl: PresetManager {
  private let factoryPresetStorage = FactoryPresetStorage()
  private let userPresetStorage = UserPresetStorage()
  private let presetAffecter = PresetAffecter()
  //プラグインインスタンスごとに異なる値になるので固定ファイルへの保存はまずい。fullStateに含めて保存する
  private(set) var lastSelectedPresetId: String?
  private var presetItemsCached: [PresetItem] = []

  func setParameterTree(_ parameterTree: AUParameterTree) {
    presetAffecter.setParameterTree(parameterTree)
  }
  func loadPresetsState() -> PresetsState {
    self.presetItemsCached = factoryPresetStorage.listItems() + userPresetStorage.listItems()
    return PresetsState(
      items: self.presetItemsCached, currentPresetSlotId: self.lastSelectedPresetId)
  }
  func loadPreset(id: String) {
    let item = self.presetItemsCached.first { $0.id == id }
    if let item {
      if let presetData = item.type == .factory
        ? factoryPresetStorage.loadPresetFile(id)
        : userPresetStorage.loadPresetFile(id)
      {
        presetAffecter.affectPresetDataToParameters(presetData)
        self.lastSelectedPresetId = id
        return
      }
    }
    logger.log("failed to load preset id: \(id)")
  }
  func savePresetAs(name: String) -> String? {
    if let presetData = presetAffecter.captureCurrentParametersWithName(name) {
      let id = "user:\(UUID().uuidString)"
      userPresetStorage.savePresetFile(id, presetData)
      self.lastSelectedPresetId = id
      let item = PresetItem(id: id, presetName: name, type: .user)
      self.presetItemsCached.append(item)
      return id
    }
    logger.log("failed to save preset")
    return nil
  }
  func overwritePreset() -> Bool {
    if let item = self.presetItemsCached.first(where: { $0.id == self.lastSelectedPresetId }) {
      if item.type == .user {
        if let presetData = presetAffecter.captureCurrentParametersWithName(item.presetName) {
          userPresetStorage.savePresetFile(item.id, presetData)
          return true
        }
      }
    }
    logger.log("failed to overwrite preset")
    return false
  }
  func deletePreset(id: String) -> Bool {
    if let item = self.presetItemsCached.first(where: { $0.id == id }) {
      if item.type == .user {
        userPresetStorage.deletePresetFile(item.id)
        self.presetItemsCached.removeAll(where: { $0.id == item.id })
        if self.lastSelectedPresetId == item.id {
          self.lastSelectedPresetId = nil
        }
        return true
      }
    }
    logger.log("failed to delete preset")
    return false
  }
  func importFromFile() {}
  func exportToFile() {}
}
