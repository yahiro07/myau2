import Combine

private enum MessageFromUI {
  //UI読み込み完了時の通知,このあとプラグイン本体から初期パラメタを送信する
  case uiLoaded
  //UI操作で変更されたパラメタをプラグイン本体に送信
  case beginParameterEdit(paramKey: String)
  case endParameterEdit(paramKey: String)
  case setParameter(paramKey: String, value: Float)
  //UIからパラメタセットを受け取り,必要ならマイグレーションを適用してparameterTreeに反映する
  case loadFullParameters(parameters: [String: Float])
  //UIに含まれる鍵盤などからのプラグイン本体に送るノートオンオフ要求
  case noteOnRequest(noteNumber: Int)
  case noteOffRequest(noteNumber: Int)
}

private enum MessageFromApp {
  //ホストやプラグイン本体で変更されたパラメタをUIに送信
  case setParameter(paramKey: String, value: Float)
  case bulkSendParameters(params: [String: Float])
  //ホストから送られたノートをUI側で受け取るメッセージ
  case hostNoteOn(noteNumber: Int, velocity: Float)
  case hostNoteOff(noteNumber: Int)
  case standaloneAppFlag
}

private func mapMessageFromUI_fromDictionary(_ dict: [String: Any]) -> MessageFromUI? {
  guard let type = dict["type"] as? String else { return nil }
  switch type {
  case "uiLoaded":
    return .uiLoaded
  case "beginParameterEdit":
    if let paramKey = dict["paramKey"] as? String {
      return .beginParameterEdit(paramKey: paramKey)
    }
  case "endParameterEdit":
    if let paramKey = dict["paramKey"] as? String {
      return .endParameterEdit(paramKey: paramKey)
    }
  case "setParameter":
    if let paramKey = dict["paramKey"] as? String,
      let value = dict["value"] as? Double
    {
      return .setParameter(paramKey: paramKey, value: Float(value))
    }
  case "noteOnRequest":
    if let noteNumber = dict["noteNumber"] as? Int {
      return .noteOnRequest(noteNumber: noteNumber)
    }
  case "noteOffRequest":
    if let noteNumber = dict["noteNumber"] as? Int {
      return .noteOffRequest(noteNumber: noteNumber)
    }

  default:
    return nil
  }
  return nil
}

private func mapMessageFromApp_toDictionary(_ msg: MessageFromApp) -> [String: Any]? {
  switch msg {
  case .setParameter(let paramKey, let value):
    return [
      "type": "setParameter",
      "paramKey": paramKey,
      "value": encodeFloatForJson(value),
    ]
  case .bulkSendParameters(let params):
    let encodedParams: [String: Any] = params.mapValues { encodeFloatForJson($0) }
    return ["type": "bulkSendParameters", "parameters": encodedParams]
  case .hostNoteOn(let noteNumber, let velocity):
    return [
      "type": "hostNoteOn",
      "noteNumber": noteNumber,
      "velocity": encodeFloatForJson(velocity),
    ]
  case .hostNoteOff(let noteNumber):
    return [
      "type": "hostNoteOff", "noteNumber": noteNumber,
    ]
  case .standaloneAppFlag:
    return [
      "type": "standaloneAppFlag"
    ]
  }
}

@MainActor
class BasicWebViewHub {
  private var webViewIo: WebViewIoProtocol?
  private var flatParameterTree: FlatObservableParameters
  private lazy var valueTracker: ObservableValueTracker = ObservableValueTracker()
  private var audioUnitPortal: AudioUnitPortal
  private var presetManager: PresetManager
  private var parameterMigrator: ParametersMigrator?

  private var portalSubscription: AnyCancellable?
  private var webViewIoSubscription: AnyCancellable?

  init(
    _ viewAccessibleResources: ViewAccessibleResources
  ) {
    self.flatParameterTree = FlatObservableParameters(
      parameterTree: viewAccessibleResources.parameterTree)
    self.audioUnitPortal = viewAccessibleResources.audioUnitPortal
    self.presetManager = viewAccessibleResources.presetManager
    self.parameterMigrator = viewAccessibleResources.parametersMigrator

    valueTracker.setReceiver { [weak self] key, value in
      self?.sendMessageToUI(.setParameter(paramKey: key, value: value))
    }
    for (paramKey, paramEntry) in flatParameterTree.entries {
      valueTracker.trackParameterValue(paramKey: paramKey, paramEntry: paramEntry)
    }
  }

  deinit {
    portalSubscription?.cancel()
    webViewIoSubscription?.cancel()
  }

  private func sendMessageToUI(_ msg: MessageFromApp) {
    if let jsDataDictionary = mapMessageFromApp_toDictionary(msg) {
      webViewIo?.sendRawMessageToUI(data: jsDataDictionary)
    } else {
      logger.log("Failed to map message from app to dictionary: \(msg)")
    }
  }

  private func handleMessageFromUI(
    msg: MessageFromUI,
  ) {
    switch msg {
    case .uiLoaded:
      logger.log("received UI loaded")
      if audioUnitPortal.isHostedInStandaloneApp {
        sendMessageToUI(.standaloneAppFlag)
      }
      let params = flatParameterTree.entries.mapValues { $0.value }
      sendMessageToUI(.bulkSendParameters(params: params))

    case .beginParameterEdit(let paramKey):
      if let paramEntry = flatParameterTree.entries[paramKey] {
        paramEntry.onEditingChanged(true)
        logger.log("begin parameter edit: \(paramKey)")
      }
    case .endParameterEdit(let paramKey):
      if let paramEntry = flatParameterTree.entries[paramKey] {
        paramEntry.onEditingChanged(false)
        logger.log("end parameter edit: \(paramKey)")
      }
    case .setParameter(let paramKey, let value):
      logger.log("received parameter changed from UI: \(paramKey) = \(value)")
      if let paramEntry = flatParameterTree.entries[paramKey] {
        valueTracker.reserveEchoSuppression(paramKey: paramKey, value: value)
        paramEntry.value = value
      } else {
        logger.log("Unknown parameter key from UI: \(paramKey)")
      }
    case .loadFullParameters(var parameters):
      logger.log("Received full parameters from UI: \(parameters)")
      self.parameterMigrator?.migrateParametersIfNeeded(
        paramVer: 0, rawParameters: &parameters)
      for (paramKey, value) in parameters {
        if let paramEntry = flatParameterTree.entries[paramKey] {
          if paramEntry.value != value {
            //ここでセットした値はUIにも送り返される
            paramEntry.value = value
          }
        }
      }
    case .noteOnRequest(let noteNumber):
      logger.log("Note On Request from UI: \(noteNumber)")
      audioUnitPortal.noteOnFromUI(noteNumber, velocity: 1.0)
    case .noteOffRequest(let noteNumber):
      logger.log("Note Off Request from UI: \(noteNumber)")
      audioUnitPortal.noteOffFromUI(noteNumber)
    }
  }

  func handlePortalEvent(_ event: AudioUnitPortalEvent) {
    switch event {
    case .hostNoteOn(let noteNumber, let velocity):
      logger.log("Received Note On from host: \(noteNumber) velocity: \(velocity)")
      sendMessageToUI(.hostNoteOn(noteNumber: noteNumber, velocity: velocity))
    case .hostNoteOff(let noteNumber):
      logger.log("Received Note Off from host: \(noteNumber)")
      sendMessageToUI(.hostNoteOff(noteNumber: noteNumber))
    case .hostPlayState(let playState):
      logger.log("Received Play State from host @whub: \(playState)")
    case .hostTempo(let tempo):
      logger.log("Received Tempo from host: \(tempo)")
    }
  }

  func bindWebViewIo(webViewIo: WebViewIoProtocol) {
    self.webViewIo = webViewIo

    portalSubscription?.cancel()
    portalSubscription = self.audioUnitPortal.events.sink { event in
      self.handlePortalEvent(event)
    }

    webViewIoSubscription?.cancel()
    webViewIoSubscription = webViewIo.subscribeRawMessageFromUI { [weak self] jsDataDictionary in
      if let msg: MessageFromUI = mapMessageFromUI_fromDictionary(jsDataDictionary) {
        logger.log("mapped message from UI: \(msg)")
        self?.handleMessageFromUI(msg: msg)
      } else {
        logger.log("Unknown or invalid message from UI \(jsDataDictionary)")
      }
    }

  }
}
