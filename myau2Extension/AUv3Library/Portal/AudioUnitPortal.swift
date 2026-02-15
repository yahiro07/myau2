import Combine

enum AudioUnitPortalEvent {
  case hostNoteOn(Int, Float)
  case hostNoteOff(Int)
  case hostTempo(Int)
  case hostPlayState(Bool)
  case standaloneAppFlag(Bool)
}

//UI側からAudioUnitの機能を利用するためのインターフェイス
//・UI上の鍵盤からのノートオン/ノートオフ
//・ホストから送られたイベントの購読
//の機能を提供する
protocol AudioUnitPortal {
  func noteOnFromUI(_ noteNumber: Int, velocity: Float)
  func noteOffFromUI(_ noteNumber: Int)
  var events: AnyPublisher<AudioUnitPortalEvent, Never> { get }
}

final class AudioUnitPortalImpl: AudioUnitPortal {
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

  typealias InputEventFeeder = () -> AudioUnitPortalEvent?
  private var eventFeeder: InputEventFeeder?

  //AudioUnit側でオーディオスレッドから拾い上げたイベントを供給するfeederメソッドをセットする
  //feederメソッドはメインスレッドから呼ばれる想定
  func setEventFeeder(_ feeder: @escaping InputEventFeeder) {
    self.eventFeeder = feeder
  }

  //メインスレッドでタイマを使ってポーリングしてイベントを流す
  //AudioUnitViewController側で一定周期でループを回してこれを呼ぶ想定
  func drainEventsOnMainThread(maxCount: Int = 64) {
    var count = 0
    while count < maxCount, let event = eventFeeder?() {
      subject.send(event)
      count += 1
    }
  }
}
