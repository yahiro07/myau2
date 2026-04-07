import CoreAudioKit
import SwiftUI

private func osTypeString(_ value: Int) -> String {
  let n = Int(value)
  var s = ""
  for i in (0..<4).reversed() {
    let shift = i * 8
    let char = UnicodeScalar((n >> shift) & 0xFF)!
    s.append(Character(char))
  }
  return s
}

func showEntryInfo(_ componentDescription: AudioComponentDescription) {
  let bundlePath = Bundle.main.bundlePath
  let bundleID = Bundle.main.bundleIdentifier ?? "unknown"
  let type = osTypeString(Int(componentDescription.componentType))
  let subType = osTypeString(Int(componentDescription.componentSubType))
  let manufacturer = osTypeString(Int(componentDescription.componentManufacturer))
  logger.log("Loaded From: \(bundlePath)")
  logger.log("Bundle ID: \(bundleID)")
  logger.log("Type: \(type), SubType: \(subType), Manufacturer: \(manufacturer)")
}
