class MyLogger {
  let updLogger = UDPLogger(category: "fw")
  public init() {}
  public func log(_ message: String) {
    updLogger.log(message)
  }
}
let logger = MyLogger()
