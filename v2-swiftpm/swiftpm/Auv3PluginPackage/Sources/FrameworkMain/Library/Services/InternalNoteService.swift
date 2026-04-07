class InternalNoteService {
  private var destinationFn: ((Int, Float) -> Void)?

  func setDestinationFn(_ destinationFn: @escaping (Int, Float) -> Void) {
    self.destinationFn = destinationFn
  }

  func requestNoteOn(_ noteNumber: Int, _ velocity: Float) {
    destinationFn?(noteNumber, velocity)
  }
  func requestNoteOff(_ noteNumber: Int) {
    destinationFn?(noteNumber, 0)
  }
}
