import CoreAudioKit

enum ParameterEditState: Int {
  case Begin = 0
  case Perform
  case End
  case InstantChange
}

protocol ControllerFacadeProtocol {
  func getAllParameterValues() -> [String: Float]
  func subscribeParameterChanges(_ listener: ((_ paramKey: String, _ value: Float) -> Void)?)
    -> Int
  func unsubscribeParameterChanges(_ token: Int)
  func applyParameterEditFromUi(_ paramKey: String, _ value: Float, _ state: ParameterEditState)
  func requestNoteOn(_ noteNumber: Int, _ velocity: Float)
  func requestNoteOff(_ noteNumber: Int)

  func subscribeHostEvents(_ listener: ((_ event: HostEvent) -> Void)?) -> Int
  func unsubscribeHostEvents(_ token: Int)
}

class ControllerFacade: ControllerFacadeProtocol {
  let audioUnit: AUAudioUnit
  let parametersService: ParametersService
  let hostEventService: HostEventService

  init(
    audioUnit: AUAudioUnit, parametersService: ParametersService, hostEventService: HostEventService
  ) {
    self.audioUnit = audioUnit
    self.parametersService = parametersService
    self.hostEventService = hostEventService
  }

  func getAllParameterValues() -> [String: Float] {
    return parametersService.getAllParameterValues()
  }

  func subscribeParameterChanges(_ listener: ((_ paramKey: String, _ value: Float) -> Void)?)
    -> Int
  {
    return parametersService.subscribeParameterChanges(listener)
  }

  func unsubscribeParameterChanges(_ token: Int) {
    parametersService.unsubscribeParameterChanges(token)
  }

  func applyParameterEditFromUi(_ paramKey: String, _ value: Float, _ state: ParameterEditState) {
    if state == .Begin {
      parametersService.setParameterEditState(paramKey, true)
    } else if state == .Perform {
      parametersService.setParameterEditValue(paramKey, value)
    } else if state == .End {
      parametersService.setParameterEditState(paramKey, false)
    } else if state == .InstantChange {
      parametersService.setParameterEditState(paramKey, true)
      parametersService.setParameterEditValue(paramKey, value)
      parametersService.setParameterEditState(paramKey, false)
    }
  }

  func requestNoteOn(_ noteNumber: Int, _ velocity: Float) {
    let bytes: [UInt8] = [0x90, UInt8(noteNumber), UInt8(velocity * 127)]
    audioUnit.scheduleMIDIEventBlock?(AUEventSampleTimeImmediate, 0, 3, bytes)
  }
  func requestNoteOff(_ noteNumber: Int) {
    let bytes: [UInt8] = [0x80, UInt8(noteNumber), 0]
    audioUnit.scheduleMIDIEventBlock?(AUEventSampleTimeImmediate, 0, 3, bytes)
  }

  func subscribeHostEvents(_ listener: ((_ event: HostEvent) -> Void)?) -> Int {
    return hostEventService.subscribe(listener)
  }

  func unsubscribeHostEvents(_ token: Int) {
    hostEventService.unsubscribe(token)
  }
}
