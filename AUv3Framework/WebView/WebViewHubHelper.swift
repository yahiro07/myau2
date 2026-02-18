import Foundation

private let jsonFloatFormatter: NumberFormatter = {
  let formatter = NumberFormatter()
  formatter.locale = Locale(identifier: "en_US_POSIX")
  formatter.numberStyle = .decimal
  formatter.usesGroupingSeparator = false
  formatter.minimumFractionDigits = 0
  formatter.maximumFractionDigits = 5
  formatter.roundingMode = .halfUp
  return formatter
}()

//文字列化で小数点以下の桁数が無駄に多くならないようにする
func encodeFloatForJson(_ value: Float) -> NSDecimalNumber {
  if let str = jsonFloatFormatter.string(from: NSNumber(value: value)) {
    return NSDecimalNumber(string: str, locale: Locale(identifier: "en_US_POSIX"))
  }
  return NSDecimalNumber(value: Double(value))
}
