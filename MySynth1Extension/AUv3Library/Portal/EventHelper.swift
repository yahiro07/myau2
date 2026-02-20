func mapPortalEventFromRaw(_ rawEvent: LowLevelPortalEvent) -> AudioUnitPortalEvent? {
  let type = rawEvent.type
  let data1: Int = Int(rawEvent.data1)
  let data2: Float = rawEvent.data2
  switch type {
  case .None:
    return nil
  case .NoteOn:
    return AudioUnitPortalEvent.hostNoteOn(data1, data2)
  case .NoteOff:
    return AudioUnitPortalEvent.hostNoteOff(data1)
  case .Tempo:
    return AudioUnitPortalEvent.hostTempo(data1)
  case .PlayState:
    return AudioUnitPortalEvent.hostPlayState(data1 != 0)
  @unknown default:
    return nil
  }
}
