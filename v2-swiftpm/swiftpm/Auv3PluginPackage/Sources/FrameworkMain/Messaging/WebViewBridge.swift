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
    logger.log("handleMessageFromUI: \(msg)")
    switch msg {
    case .uiLoaded:
      logger.log("ui loaded")
      let allParameters = controllerFacade.getAllParameterValues()
      let msg = mapMessageFromApp_toJsonString(.bulkSendParameters(params: allParameters))
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
