import Foundation

// private struct CombinedMessageFromUI: Decodable {
//   let type: String
//   let noteNumber: Int?
//   let paramKey: String?
//   let value: Float?
// }

// public func parseMessageFromUI(_ text: String) -> MessageFromUI? {
//   guard let data = text.data(using: .utf8) else { return nil }
//   do {
//     let obj = try JSONDecoder().decode(CombinedMessageFromUI.self, from: data)
//     switch obj.type {
//     case "uiLoaded":
//       return .uiLoaded
//     case "setParameter":
//       guard let paramKey = obj.paramKey, let v = obj.value else { return nil }
//       return .setParameter(paramKey: paramKey, value: v)
//     case "noteOn":
//       guard let n = obj.noteNumber else { return nil }
//       return .noteOn(noteNumber: n)
//     case "noteOff":
//       guard let n = obj.noteNumber else { return nil }
//       return .noteOff(noteNumber: n)
//     default:
//       logger.log("unknown type: \(obj.type)")
//       return nil
//     }
//   } catch {
//     logger.log("decode error: \(error)")
//     return nil
//   }
// }

// public func stringifyMessageFromApp(msg: MessageFromApp) -> String? {
//   let dict = mapMessageFromApp_toDictionary(msg: msg)
//   if dict != nil {
//     let data = try! JSONSerialization.data(withJSONObject: dict as Any, options: [])
//     return String(data: data, encoding: .utf8)!
//   }
//   return nil
// }
