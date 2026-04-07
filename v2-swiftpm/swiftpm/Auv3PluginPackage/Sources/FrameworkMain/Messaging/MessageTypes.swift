enum MessageFromUI {
  case log(timestamp: Double, logKind: String, message: String)
  case uiLoaded
  case beginEdit(_ paramKey: String)
  case endEdit(_ paramKey: String)
  case performEdit(_ paramKey: String, _ value: Float)
  case instantEdit(_ paramKey: String, _ value: Float)
  case noteOnRequest(_ noteNumber: Int)
  case noteOffRequest(_ noteNumber: Int)
  case loadFullParameters(parameters: [String: Float])
  //
  case rpcReadFileRequest(rpcId: Int, path: String, skipIfNotExists: Bool)
  case rpcWriteFileRequest(rpcId: Int, path: String, content: String, append: Bool)
  case rpcDeleteFileRequest(rpcId: Int, path: String)
  case rpcLoadStateKvsItemsRequest(rpcId: Int)
  case writeStateKvsItem(key: String, value: String)
  case deleteStateKvsItem(key: String)
}

enum MessageFromApp {
  case setParameter(paramKey: String, value: Float)
  case bulkSendParameters(parameters: [String: Float])
  case hostNoteOn(noteNumber: Int)
  case hostNoteOff(noteNumber: Int)
  case hostTempo(tempo: Float)
  case hostPlayState(isPlaying: Bool)
  //
  case rpcReadFileResponse(rpcId: Int, success: Bool, content: String)
  case rpcWriteFileResponse(rpcId: Int, success: Bool)
  case rpcDeleteFileResponse(rpcId: Int, success: Bool)
  case rpcLoadStateKvsItemsResponse(rpcId: Int, items: [String: String])
}
