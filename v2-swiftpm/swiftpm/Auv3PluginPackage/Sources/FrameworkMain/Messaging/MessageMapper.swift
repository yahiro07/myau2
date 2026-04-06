import SwiftUI

func mapMessageFromUI_fromJsonString(_ jsonString: String) -> MessageFromUI? {
  let dict =
    try? JSONSerialization.jsonObject(with: jsonString.data(using: .utf8)!, options: [])
    as? [String: Any]
  guard let dict = dict else { return nil }
  guard let type = dict["type"] as? String else { return nil }
  switch type {
  case "uiLoaded":
    return .uiLoaded
  case "beginEdit":
    if let paramKey = dict["paramKey"] as? String {
      return .beginEdit(paramKey)
    }
  case "performEdit":
    if let paramKey = dict["paramKey"] as? String,
      let value = dict["value"] as? Double
    {
      return .performEdit(paramKey, Float(value))
    }
  case "endEdit":
    if let paramKey = dict["paramKey"] as? String {
      return .endEdit(paramKey)
    }
  case "instantEdit":
    if let paramKey = dict["paramKey"] as? String,
      let value = dict["value"] as? Double
    {
      return .instantEdit(paramKey, Float(value))
    }
  case "noteOnRequest":
    if let noteNumber = dict["noteNumber"] as? Int {
      return .noteOnRequest(noteNumber)
    }
  case "noteOffRequest":
    if let noteNumber = dict["noteNumber"] as? Int {
      return .noteOffRequest(noteNumber)
    }
  default:
    return nil
  }
  return nil
}

private func toJson(_ dict: [String: Any]) -> String {
  let data = try! JSONSerialization.data(withJSONObject: dict as Any, options: [])
  return String(data: data, encoding: .utf8)!
}

func mapMessageFromApp_toJsonString(_ msg: MessageFromApp) -> String {
  switch msg {
  case .setParameter(let paramKey, let value):
    return toJson([
      "type": "setParameter",
      "paramKey": paramKey,
      "value": value,
    ])
  case .bulkSendParameters(let params):
    return toJson([
      "type": "bulkSendParameters",
      "params": params,
    ])
  case .hostNoteOn(let noteNumber, let velocity):
    return toJson([
      "type": "hostNoteOn",
      "noteNumber": noteNumber,
      "velocity": velocity,
    ])
  case .hostNoteOff(let noteNumber):
    return toJson([
      "type": "hostNoteOff",
      "noteNumber": noteNumber,
    ])
  case .hostTempo(let tempo):
    return toJson([
      "type": "hostTempo",
      "tempo": tempo,
    ])
  case .hostPlayState(let isPlaying):
    return toJson([
      "type": "hostPlayState",
      "isPlaying": isPlaying,
    ])
  }
}

func mapHostEventToMessage(_ event: HostEvent) -> MessageFromApp {
  switch event {
  case .hostNoteOn(let noteNumber, let velocity):
    return .hostNoteOn(noteNumber: noteNumber, velocity: velocity)
  case .hostNoteOff(let noteNumber):
    return .hostNoteOff(noteNumber: noteNumber)
  case .hostTempo(let tempo):
    return .hostTempo(tempo: tempo)
  case .hostPlayState(let isPlaying):
    return .hostPlayState(isPlaying: isPlaying)
  }
}
