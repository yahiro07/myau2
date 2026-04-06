import DspRoute

enum HostEvent {
  case hostNoteOn(Int, Float)
  case hostNoteOff(Int)
  case hostTempo(Float)
  case hostPlayState(Bool)
}

func mapHostEventFromRtHostEvent(_ e: RtHostEvent) -> HostEvent? {
  switch e.type {
  case .None: return nil
  case .NoteOn: return .hostNoteOn(Int(e.noteOn.noteNumber), e.noteOn.velocity)
  case .NoteOff: return .hostNoteOff(Int(e.noteOff.noteNumber))
  case .Tempo: return .hostTempo(e.tempo.tempo)
  case .PlayState: return .hostPlayState(e.playState.isPlaying)
  default: return nil
  }
}
