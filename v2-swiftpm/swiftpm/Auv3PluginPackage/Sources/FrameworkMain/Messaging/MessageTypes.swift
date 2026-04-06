enum MessageFromUI {
  case uiLoaded
  case beginEdit(_ paramKey: String)
  case endEdit(_ paramKey: String)
  case performEdit(_ paramKey: String, _ value: Float)
  case instantEdit(_ paramKey: String, _ value: Float)
  case noteOnRequest(_ noteNumber: Int)
  case noteOffRequest(_ noteNumber: Int)
}

enum MessageFromApp {
  case setParameter(paramKey: String, value: Float)
  case bulkSendParameters(params: [String: Float])
  case hostNoteOn(noteNumber: Int, velocity: Float)
  case hostNoteOff(noteNumber: Int)
  case hostTempo(tempo: Float)
  case hostPlayState(isPlaying: Bool)
}
