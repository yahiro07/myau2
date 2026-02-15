import SwiftUI

struct MyPluginContentView0: View {

  init(
    parameterTree: ObservableAUParameterGroup, audioUnitPortal: AudioUnitPortal,
    presetManager: PresetManager
  ) {
  }

  var body: some View {
    VStack {
      Text("myau2Extension dev 0433")
      Button("Write") {
        logger.log("write file here")
        testWriteFileToAppGroupContainer()
      }
      Button("Read") {
        logger.log("read file here")
        testReadFileFromAppGroupContainer()
      }

      Button("Read Asset JSON") {
        logger.log("read asset json here")
        testReadAssetJSON()
      }
    }.padding(40).border(.orange, width: 2).ignoresSafeArea()
  }
}

func testReadAssetJSON() {
  guard
    let url = Bundle(for: MyPluginCore.self).url(
      forResource: "test", withExtension: "json", subdirectory: "presets")
  else {
    logger.log("Asset JSON file not found.")
    return
  }
  do {
    let data = try Data(contentsOf: url)
    if let jsonString = String(data: data, encoding: .utf8) {
      logger.log("Asset JSON content:\n\(jsonString)")
    } else {
      logger.log("Failed to decode JSON as UTF-8 string.")
    }
  } catch {
    logger.log("Error reading asset JSON: \(error)")
  }
}

func testWriteFileToAppGroupContainer() {
  let fileName = "test.txt"
  let content = "Hello, App Group! 0440"
  do {
    let fileURL = try SharedContainer0.userPresetFileURL(presetName: fileName)
    logger.log("Writing to: \(fileURL.path) dir=\(fileURL.hasDirectoryPath)")
    try content.write(to: fileURL, atomically: true, encoding: .utf8)
    logger.log("File written.")
  } catch {
    logger.log("Error writing file: \(error)")
  }
}

func testReadFileFromAppGroupContainer() {
  let fileName = "test.txt"
  do {
    let fileURL = try SharedContainer0.userPresetFileURL(presetName: fileName)
    let content = try String(contentsOf: fileURL, encoding: .utf8)
    logger.log("File content: \(content)")
  } catch {
    logger.log("Error reading file: \(error)")
  }
}

enum SharedContainer0 {
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

  static func ensureSubFolder(folderName: String) throws -> URL {
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

  static func userPresetFileURL(presetName: String) throws -> URL {
    let folderURL = try ensureSubFolder(folderName: "user_presets")
    return folderURL.appendingPathComponent(presetName, isDirectory: false)
  }
}
