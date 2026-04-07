import Combine
import SwiftUI

class WebViewBridge: ObservableObject {
  private let controllerFacade: ControllerFacadeProtocol
  private var webViewIo: WebViewIoProtocol?
  private var webViewIoSubscription: AnyCancellable?
  private var parameterChangesToken: Int = 0
  private var hostEventsToken: Int = 0

  init(_ controllerFacade: ControllerFacadeProtocol) {
    self.controllerFacade = controllerFacade
  }

  @MainActor
  private func handleMessageFromUI(msg: MessageFromUI) {
    // logger.log("handleMessageFromUI: \(msg)")
    switch msg {
    case .log(let timestamp, let logKind, let message):
      logger.pushLogItem(
        LogItem(timestamp: timestamp, subsystem: "ui", logKind: logKind, message: message))
    case .uiLoaded:
      logger.log("ui loaded")
      let parameters = controllerFacade.getAllParameterValues()
      let msg = mapMessageFromApp_toJsonString(.bulkSendParameters(parameters: parameters))
      webViewIo?.sendMessage(msg)
    case .beginEdit(let paramKey):
      controllerFacade.applyParameterEditFromUi(paramKey, 0, ParameterEditState.Begin)
    case .performEdit(let paramKey, let value):
      controllerFacade.applyParameterEditFromUi(paramKey, value, ParameterEditState.Perform)
    case .endEdit(let paramKey):
      controllerFacade.applyParameterEditFromUi(paramKey, 0, ParameterEditState.End)
    case .instantEdit(let paramKey, let value):
      controllerFacade.applyParameterEditFromUi(paramKey, value, ParameterEditState.InstantChange)
    case .noteOnRequest(let noteNumber):
      controllerFacade.requestNoteOn(noteNumber, 1.0)
    case .noteOffRequest(let noteNumber):
      controllerFacade.requestNoteOff(noteNumber)
    case .loadFullParameters(let parameters):
      controllerFacade.loadFullParametersSuit(parameters)
    case .rpcReadFileRequest(let rpcId, let path, let skipIfNotExists):
      let content = controllerFacade.readFile(path: path, skipIfNotExist: skipIfNotExists)
      let msg = mapMessageFromApp_toJsonString(
        .rpcReadFileResponse(rpcId: rpcId, success: content != nil, content: content ?? ""))
      webViewIo?.sendMessage(msg)
    case .rpcWriteFileRequest(let rpcId, let path, let content, let append):
      let success = controllerFacade.writeFile(path: path, content: content, append: append)
      let msg = mapMessageFromApp_toJsonString(
        .rpcWriteFileResponse(rpcId: rpcId, success: success))
      webViewIo?.sendMessage(msg)
    case .rpcDeleteFileRequest(let rpcId, let path):
      let success = controllerFacade.deleteFile(path: path)
      let msg = mapMessageFromApp_toJsonString(
        .rpcDeleteFileResponse(rpcId: rpcId, success: success))
      webViewIo?.sendMessage(msg)
    case .rpcLoadStateKvsItemsRequest(let rpcId):
      let items = controllerFacade.getStateKvsItems()
      let msg = mapMessageFromApp_toJsonString(
        .rpcLoadStateKvsItemsResponse(rpcId: rpcId, items: items))
      webViewIo?.sendMessage(msg)
    case .writeStateKvsItem(let key, let value):
      controllerFacade.writeStateKvsItem(key: key, value: value)
    case .deleteStateKvsItem(let key):
      controllerFacade.deleteStateKvsItem(key: key)
    }
  }

  @MainActor
  func bindWebView(_ webViewIo: WebViewIoProtocol) {
    logger.info("bindWebView")
    self.webViewIo = webViewIo
    webViewIoSubscription = webViewIo.subscribeMessage { [weak self] message in
      if let msg: MessageFromUI = mapMessageFromUI_fromJsonString(message) {
        self?.handleMessageFromUI(msg: msg)
      } else {
        logger.warn("Unknown or invalid message from UI \(message)")
      }
    }
    parameterChangesToken = controllerFacade.subscribeParameterChanges({ paramKey, value in
      let msg = mapMessageFromApp_toJsonString(.setParameter(paramKey: paramKey, value: value))
      webViewIo.sendMessage(msg)
    })
    hostEventsToken = controllerFacade.subscribeHostEvents({ e in
      let msg = mapHostEventToMessage(e)
      let json = mapMessageFromApp_toJsonString(msg)
      webViewIo.sendMessage(json)
    })
  }

  func unbindWebView() {
    logger.info("unbindWebView")
    if webViewIo != nil {
      webViewIoSubscription?.cancel()
      webViewIo = nil
    }
    if parameterChangesToken != 0 {
      controllerFacade.unsubscribeParameterChanges(parameterChangesToken)
      parameterChangesToken = 0
    }
    if hostEventsToken != 0 {
      controllerFacade.unsubscribeHostEvents(hostEventsToken)
      hostEventsToken = 0
    }
  }
}
