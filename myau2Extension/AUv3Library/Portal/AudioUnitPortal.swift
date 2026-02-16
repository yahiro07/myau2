import Combine

enum AudioUnitPortalEvent {
  case hostNoteOn(Int, Float)
  case hostNoteOff(Int)
  case hostTempo(Int)
  case hostPlayState(Bool)
  // case standaloneAppFlag(Bool)
}

//UI側からAudioUnitの機能を利用するためのインターフェイス
//・UI上の鍵盤からのノートオン/ノートオフ
//・ホストから送られたイベントの購読
//の機能を提供する
protocol AudioUnitPortal {
  var isHostedInStandaloneApp: Bool { get }
  func noteOnFromUI(_ noteNumber: Int, velocity: Float)
  func noteOffFromUI(_ noteNumber: Int)
  var events: AnyPublisher<AudioUnitPortalEvent, Never> { get }
}

final class AudioUnitPortalImpl: AudioUnitPortal {
  var parametersVersion: Int = 0

  var isHostedInStandaloneApp = false

  typealias MidiDestinationFn = ([UInt8]) -> Void
  private var midiDestinationFn: MidiDestinationFn?

  func setMidiDestinationFn(_ midiDestinationFn: @escaping MidiDestinationFn) {
    self.midiDestinationFn = midiDestinationFn
  }

  func noteOnFromUI(_ noteNumber: Int, velocity: Float) {
    let byteVelocity = UInt8(max(0, min(127, Int(velocity * 127))))
    midiDestinationFn?([0x90, UInt8(noteNumber), byteVelocity])
  }

  func noteOffFromUI(_ noteNumber: Int) {
    midiDestinationFn?([0x80, UInt8(noteNumber), 0])
  }

  private let subject = PassthroughSubject<AudioUnitPortalEvent, Never>()
  var events: AnyPublisher<AudioUnitPortalEvent, Never> {
    subject.eraseToAnyPublisher()
  }

  func emitEvent(_ event: AudioUnitPortalEvent) {
    subject.send(event)
  }
}
