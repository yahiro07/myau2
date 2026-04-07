import Foundation
import Network
import os

struct LogItem {
  let timestamp: Double  //ms from epoch
  let subsystem: String
  let logKind: String  //trace, info, log, warn, error
  let message: String
}

//00:00:00.000
func formatTimestamp(_ timestamp: Double) -> String {
  let date = Date(timeIntervalSince1970: timestamp / 1000)
  let formatter = DateFormatter()
  formatter.dateFormat = "HH:mm:ss.SSS"
  return formatter.string(from: date)
}

let subsystemIcons: [String: String] = [
  "host": "🧊",
  "ext": "🔸",
  "ui": "🔹",
  "dsp": "🔺",
]

let logKindIcons: [String: String] = [
  "trace": "🔽",
  "info": "◻️",
  "log": "▫️",
  "warn": "⚠️",
  "error": "📛",
]

#if DEBUG

  class UDPLogger {
    private var conn: NWConnection?
    private let dispatchQueue = DispatchQueue(label: "UDPLogger")

    init() {}

    private func ensureConnection() {
      if conn != nil { return }

      let nwHost = NWEndpoint.Host("127.0.0.1")
      let nwPort = NWEndpoint.Port(integerLiteral: 9001)
      conn = NWConnection(host: nwHost, port: nwPort, using: .udp)

      conn?.start(queue: dispatchQueue)
    }

    private func log(_ logLine: String) {
      guard let content = logLine.data(using: .utf8) else { return }
      let workItem = DispatchWorkItem { [weak self] in
        guard let self else { return }
        self.ensureConnection()
        self.conn?.send(
          content: content,
          completion: .contentProcessed({ error in }))
      }
      dispatchQueue.async(execute: workItem)
    }

    func pushLogLine(_ logLine: String) {
      log(logLine)
    }
  }

  class LoggerCore {
    let udpLogger = UDPLogger()

    private func printLogLine(_ item: LogItem) {
      let ts = formatTimestamp(item.timestamp)
      let ssIcon = subsystemIcons[item.subsystem] ?? ""
      let kindIcon = logKindIcons[item.logKind] ?? ""
      let logLine = "\(ts) [\(ssIcon)\(item.subsystem)] \(kindIcon) \(item.message)"
      print(logLine)
    }
    func pushLogItem(_ item: LogItem) {
      printLogLine(item)

      let timestamp = item.timestamp
      let subsystem = item.subsystem
      let logKind = item.logKind
      let message = item.message.replacingOccurrences(of: "\"", with: "\\\"")
      let jsonText =
        "{ \"timestamp\": \(timestamp), \"subsystem\": \"\(subsystem)\", \"logKind\": \"\(logKind)\", \"message\": \"\(message)\"}"
      udpLogger.pushLogLine(jsonText)
    }
  }

  class LoggerEntry {
    private let loggerCore = LoggerCore()
    private let subsystem: String

    init(subsystem: String) {
      self.subsystem = subsystem
    }

    func pushLogItem(_ item: LogItem) {
      loggerCore.pushLogItem(item)
    }

    private func pushLog(_ logKind: String, _ message: String) {
      let item = LogItem(
        timestamp: Date().timeIntervalSince1970 * 1000, subsystem: subsystem, logKind: logKind,
        message: message
      )
      loggerCore.pushLogItem(item)
    }

    func trace(_ message: String) {
      pushLog("trace", message)
    }

    func info(_ message: String) {
      pushLog("info", message)
    }

    func log(_ message: String) {
      pushLog("log", message)
    }

    func warn(_ message: String) {
      pushLog("warn", message)
    }

    func error(_ message: String) {
      pushLog("error", message)
    }
  }

  nonisolated(unsafe) let logger = LoggerEntry(subsystem: "host")

#else

  final class LoggerEntry: Sendable {
    init() {}
    func trace(_ message: String) {
    }
    func info(_ message: String) {
    }
    func log(_ message: String) {
    }
    func warn(_ message: String) {
    }
    func error(_ message: String) {
    }
  }
  let logger = LoggerEntry()
#endif
