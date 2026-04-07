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
  func loadFullParametersSuit(_ parameters: [String: Float])

  func requestNoteOn(_ noteNumber: Int, _ velocity: Float)
  func requestNoteOff(_ noteNumber: Int)

  func subscribeHostEvents(_ listener: ((_ event: HostEvent) -> Void)?) -> Int
  func unsubscribeHostEvents(_ token: Int)

  func readFile(path: String, skipIfNotExist: Bool?) -> String?
  func writeFile(path: String, content: String, append: Bool?) -> Bool
  func deleteFile(path: String) -> Bool
  func getStateKvsItems() -> [String: String]
  func writeStateKvsItem(key: String, value: String)
  func deleteStateKvsItem(key: String)

}

class ControllerFacade: ControllerFacadeProtocol {
  let parametersService: ParametersService
  let hostEventService: HostEventService
  let internalNoteService: InternalNoteService
  let storageFileIoService: StorageFileIoService
  let stateKvsService: StateKvsService

  init(
    parametersService: ParametersService,
    hostEventService: HostEventService,
    internalNoteService: InternalNoteService,
    storageFileIoService: StorageFileIoService,
    stateKvsService: StateKvsService
  ) {
    self.parametersService = parametersService
    self.hostEventService = hostEventService
    self.internalNoteService = internalNoteService
    self.storageFileIoService = storageFileIoService
    self.stateKvsService = stateKvsService
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

  func loadFullParametersSuit(_ parameters: [String: Float]) {
    parametersService.loadFullParametersSuit(parameters)
  }

  func requestNoteOn(_ noteNumber: Int, _ velocity: Float) {
    internalNoteService.requestNoteOn(noteNumber, velocity)
  }
  func requestNoteOff(_ noteNumber: Int) {
    internalNoteService.requestNoteOff(noteNumber)
  }

  func subscribeHostEvents(_ listener: ((_ event: HostEvent) -> Void)?) -> Int {
    return hostEventService.subscribe(listener)
  }

  func unsubscribeHostEvents(_ token: Int) {
    hostEventService.unsubscribe(token)
  }

  func readFile(path: String, skipIfNotExist: Bool?) -> String? {
    return storageFileIoService.readFile(path: path, skipIfNotExist: skipIfNotExist)
  }

  func writeFile(path: String, content: String, append: Bool?) -> Bool {
    return storageFileIoService.writeFile(path: path, content: content, append: append)
  }

  func deleteFile(path: String) -> Bool {
    return storageFileIoService.deleteFile(path: path)
  }

  func getStateKvsItems() -> [String: String] {
    return stateKvsService.getItems()
  }

  func writeStateKvsItem(key: String, value: String) {
    stateKvsService.write(key, value)
  }

  func deleteStateKvsItem(key: String) {
    stateKvsService.delete(key)
  }
}
