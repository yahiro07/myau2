import SwiftUI

func mapMessageFromUI_fromJsonString(_ jsonString: String) -> MessageFromUI? {
  let dict =
    try? JSONSerialization.jsonObject(with: jsonString.data(using: .utf8)!, options: [])
    as? [String: Any]
  guard let dict = dict else { return nil }
  guard let type = dict["type"] as? String else { return nil }
  switch type {
  case "log":
    if let timestamp = dict["timestamp"] as? Double,
      let logKind = dict["logKind"] as? String,
      let message = dict["message"] as? String
    {
      return .log(timestamp: timestamp, logKind: logKind, message: message)
    }
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
  case "loadFullParameters":
    if let parameters = dict["parameters"] as? [String: Float] {
      return .loadFullParameters(parameters: parameters)
    }
  case "rpcReadFileRequest":
    if let rpcId = dict["rpcId"] as? Int,
      let path = dict["path"] as? String,
      let skipIfNotExists = dict["skipIfNotExists"] as? Bool
    {
      return .rpcReadFileRequest(rpcId: rpcId, path: path, skipIfNotExists: skipIfNotExists)
    }
  case "rpcWriteFileRequest":
    if let rpcId = dict["rpcId"] as? Int,
      let path = dict["path"] as? String,
      let content = dict["content"] as? String,
      let append = dict["append"] as? Bool
    {
      return .rpcWriteFileRequest(rpcId: rpcId, path: path, content: content, append: append)
    }
  case "rpcDeleteFileRequest":
    if let rpcId = dict["rpcId"] as? Int,
      let path = dict["path"] as? String
    {
      return .rpcDeleteFileRequest(rpcId: rpcId, path: path)
    }
  case "rpcLoadStateKvsItemsRequest":
    if let rpcId = dict["rpcId"] as? Int {
      return .rpcLoadStateKvsItemsRequest(rpcId: rpcId)
    }
  case "writeStateKvsItem":
    if let key = dict["key"] as? String,
      let value = dict["value"] as? String
    {
      return .writeStateKvsItem(key: key, value: value)
    }
  case "deleteStateKvsItem":
    if let key = dict["key"] as? String {
      return .deleteStateKvsItem(key: key)
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
      "parameters": params,
    ])
  case .hostNoteOn(let noteNumber):
    return toJson([
      "type": "hostNoteOn",
      "noteNumber": noteNumber,
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
  case .rpcReadFileResponse(let rpcId, let success, let content):
    return toJson([
      "type": "rpcReadFileResponse",
      "rpcId": rpcId,
      "success": success,
      "content": content,
    ])
  case .rpcWriteFileResponse(let rpcId, let success):
    return toJson([
      "type": "rpcWriteFileResponse",
      "rpcId": rpcId,
      "success": success,
    ])
  case .rpcDeleteFileResponse(let rpcId, let success):
    return toJson([
      "type": "rpcDeleteFileResponse",
      "rpcId": rpcId,
      "success": success,
    ])
  case .rpcLoadStateKvsItemsResponse(let rpcId, let items):
    return toJson([
      "type": "rpcLoadStateKvsItemsResponse",
      "rpcId": rpcId,
      "items": items,
    ])
  }
}

func mapHostEventToMessage(_ event: HostEvent) -> MessageFromApp {
  switch event {
  case .hostNoteOn(let noteNumber):
    return .hostNoteOn(noteNumber: noteNumber)
  case .hostNoteOff(let noteNumber):
    return .hostNoteOff(noteNumber: noteNumber)
  case .hostTempo(let tempo):
    return .hostTempo(tempo: tempo)
  case .hostPlayState(let isPlaying):
    return .hostPlayState(isPlaying: isPlaying)
  }
}
