import Combine

private enum MessageFromUI {
  //UI読み込み完了時の通知,このあとプラグイン本体から初期パラメタを送信する
  case uiLoaded
  //UI操作で変更されたパラメタをプラグイン本体に送信
  case beginParameterEdit(paramKey: String)
  case endParameterEdit(paramKey: String)
  case setParameter(paramKey: String, value: Float)
  //UIに含まれる鍵盤などからのプラグイン本体に送るノートオンオフ要求
  case noteOnRequest(noteNumber: Int)
  case noteOffRequest(noteNumber: Int)
}

private enum MessageFromApp {
  //ホストやプラグイン本体で変更されたパラメタをUIに送信
  case setParameter(paramKey: String, value: Float)
  case bulkSetParameters(params: [String: Float])
  //ホストから送られたノートをUI側で受け取るメッセージ
  case hostNoteOn(noteNumber: Int, velocity: Float)
  case hostNoteOff(noteNumber: Int, velocity: Float)
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
  case .bulkSetParameters(let params):
    let encodedParams: [String: Any] = params.mapValues { encodeFloatForJson($0) }
    return ["type": "bulkSetParameters", "parameters": encodedParams]
  case .hostNoteOn(let noteNumber, let velocity):
    return [
      "type": "hostNoteOn",
      "noteNumber": noteNumber,
      "velocity": encodeFloatForJson(velocity),
    ]
  case .hostNoteOff(let noteNumber, let velocity):
    return [
      "type": "hostNoteOff",
      "noteNumber": noteNumber,
      "velocity": encodeFloatForJson(velocity),
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

  private var portalSubscription: AnyCancellable?
  private var webViewIoSubscription: AnyCancellable?

  init(
    _ viewAccessibleResources: ViewAccessibleResources
  ) {
    self.flatParameterTree = FlatObservableParameters(
      parameterTree: viewAccessibleResources.parameterTree)
    self.audioUnitPortal = viewAccessibleResources.audioUnitPortal
    self.presetManager = viewAccessibleResources.presetManager

    valueTracker.setReceiver { [weak self] key, value in
      self?.sendMessageToUI(msg: .setParameter(paramKey: key, value: value))
    }
    for (paramKey, paramEntry) in flatParameterTree.entries {
      valueTracker.trackParameterValue(paramKey: paramKey, paramEntry: paramEntry)
    }
  }

  deinit {
    portalSubscription?.cancel()
    webViewIoSubscription?.cancel()
  }

  private func sendMessageToUI(msg: MessageFromApp) {
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
      print("⭐️UI Loaded")
      logger.log("received UI loaded")
      //debug
      sendMessageToUI(
        msg: .setParameter(paramKey: "initComplete", value: 1.0))
      let params = flatParameterTree.entries.mapValues { $0.value }
      sendMessageToUI(msg: .bulkSetParameters(params: params))

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
    case .noteOnRequest(let noteNumber):
      logger.log("Note On Request from UI: \(noteNumber)")
      audioUnitPortal.noteOnFromUI(noteNumber, velocity: 1.0)
    case .noteOffRequest(let noteNumber):
      logger.log("Note Off Request from UI: \(noteNumber)")
      audioUnitPortal.noteOffFromUI(noteNumber)
    }
  }

  func bindWebViewIo(webViewIo: WebViewIoProtocol) {
    self.webViewIo = webViewIo

    portalSubscription?.cancel()
    portalSubscription = self.audioUnitPortal.events.sink { event in
      logger.log("Received event from AudioUnit @whub: \(event)")
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
