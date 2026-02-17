// enum LogKind {
//   case log
//   case mark
//   case warn
//   case error
//   case mute
//   case unmute
// }

public struct LogItem {
  let timestamp: Double
  let subSystem: String
  let kind: String
  let message: String
}

// func parseLogText(msg: String) -> LogItem {
//   let headPart = msg.firstMatch(of: /(\(.*?)\)\s/) ?? nil
//   if let headPart {
//     let msgBody = msg.replacing(headPart.0, with: "", maxReplacements: 1).trimmingCharacters(
//       in: .whitespaces)
//     var kv: [String: String] = [:]
//     headPart.0.split(separator: ",").forEach { part in
//       let parts = part.split(separator: ":")
//       kv[String(parts[0])] = String(parts[1])
//     }
//     let timestamp = Float(kv["t"] ?? "") ?? 0
//     let subSystem = kv["s"] ?? "unknown"
//     let kind = kv["k"] ?? "log"
//     return LogItem(timestamp: timestamp, subSystem: subSystem, message: msgBody, kind: kind)
//   }
//   return LogItem(timestamp: 0, subSystem: "unknown", message: msg, kind: "log")
// }

//TODO: 00:00:00.000にしたい
func formatTimestamp(_ timestamp: Double) -> String {
  let date = Date(timeIntervalSince1970: timestamp)
  return date.formatted(date: .omitted, time: .standard)
}

let subSystemIcons: [String: String] = [
  "host": "🏠",
  "ext": "🔸",
  "ui": "🔹",
  "dsp": "🔺",
]

let logKindIcons: [String: String] = [
  "log": "",
  "mark": "🔽",
  "warn": "⚠️",
  "error": "📛",
]

public class LoggerCore {
  let udpLogger = UDPLogger(category: "ext")

  public func pushLogItem(_ item: LogItem) {
    let ts = formatTimestamp(item.timestamp)
    let ssIcon = subSystemIcons[item.subSystem] ?? ""
    let kindIcon = logKindIcons[item.kind] ?? ""

    let logLine = "\(ts) [\(ssIcon)\(item.subSystem)] \(kindIcon) \(item.message)"
    if true {
      print(logLine)
    }
    if true {
      udpLogger.log(logLine)
    }
  }
}
public let loggerCore = LoggerCore()

public class LoggerEntry {

  private let subSystem: String

  public init(subSystem: String) {
    self.subSystem = subSystem
  }

  private func pushLog(_ kind: String, _ message: String) {
    loggerCore.pushLogItem(
      LogItem(
        timestamp: Date().timeIntervalSince1970, subSystem: subSystem, kind: kind, message: message
      ))
  }

  public func log(_ message: String) {
    pushLog("log", message)
  }

  public func mark(_ message: String) {
    pushLog("mark", message)
  }

  public func warn(_ message: String) {
    pushLog("warn", message)
  }

  public func error(_ message: String) {
    pushLog("error", message)
  }
}

public let logger = LoggerEntry(subSystem: "ext")
