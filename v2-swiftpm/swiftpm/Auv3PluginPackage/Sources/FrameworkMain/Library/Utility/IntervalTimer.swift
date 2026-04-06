import Foundation

class IntervalTimer {
  private var timer: Timer?

  func start(intervalMs: Int, callback: @Sendable @escaping () -> Void) {
    let interval = TimeInterval(intervalMs) / 1000.0
    timer = Timer(timeInterval: interval, repeats: true) { _ in
      callback()
    }
    RunLoop.main.add(timer!, forMode: .common)
  }

  func stop() {
    timer?.invalidate()
    timer = nil
  }
}
