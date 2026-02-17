import AUv3Framework

class MyLogger {
  let updLogger = UDPLogger(category: "ext")
  public init() {}
  public func log(_ message: String) {
    updLogger.log(message)
  }
}
let logger = MyLogger()
