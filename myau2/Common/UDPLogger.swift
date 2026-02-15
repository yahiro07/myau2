import Foundation
import Network
import os

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

    func log(_ message: String) {
      print(message)

      guard let content = message.data(using: .utf8) else { return }

      dispatchQueue.async { [weak self] in
        guard let self else { return }
        self.ensureConnection()
        self.conn?.send(
          content: content,
          completion: .contentProcessed({ error in }))
      }
    }
  }

#else

  class UDPLogger {
    init() {}
    func log(_ message: String) {}
  }

#endif

let logger = UDPLogger()
