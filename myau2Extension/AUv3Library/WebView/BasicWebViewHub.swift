import Combine

private enum MessageFromUI {
  //UI読み込み完了時の通知,このあとプラグイン本体から初期パラメタを送信する
  case uiLoaded
  //UI操作で変更されたパラメタをプラグイン本体に送信
  case beginParameterEdit(paramKey: String)
  case endParameterEdit(paramKey: String)
  case setParameter(paramKey: String, value: Float)
  //UIからパラメタセットを受け取り,必要ならマイグレーションを適用してparameterTreeに反映する,プリセットロード用
  case loadFullParameters(parametersVersion: Int, parameters: [String: Float])
  //UIに含まれる鍵盤などからのプラグイン本体に送るノートオンオフ要求
  case noteOnRequest(noteNumber: Int)
  case noteOffRequest(noteNumber: Int)
  //
  case rpcReadFileRequest(rpcId: Int, path: String, skipIfNotExists: Bool)
  case rpcWriteFileRequest(rpcId: Int, path: String, content: String, append: Bool)
  case rpcDeleteFileRequest(rpcId: Int, path: String)
}

private enum MessageFromApp {
  //ホストやプラグイン本体で変更されたパラメタをUIに送信
  case setParameter(paramKey: String, value: Float)
  case bulkSendParameters(params: [String: Float])
  //ホストから送られたノートをUI側で受け取るメッセージ
  case hostNoteOn(noteNumber: Int, velocity: Float)
  case hostNoteOff(noteNumber: Int)
  case standaloneAppFlag
  case latestParametersVersion(version: Int)
  //
  case rpcReadFileResponse(rpcId: Int, success: Bool, content: String)
  case rpcWriteFileResponse(rpcId: Int, success: Bool)
  case rpcDeleteFileResponse(rpcId: Int, success: Bool)
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
  case "loadFullParameters":
    if let parametersVersion = dict["parametersVersion"] as? Int,
      let parametersDict = dict["parameters"] as? [String: Float]
    {
      var parameters: [String: Float] = [:]
      for (key, value) in parametersDict {
        parameters[key] = value
      }
      return .loadFullParameters(parametersVersion: parametersVersion, parameters: parameters)
    }
  case "noteOnRequest":
    if let noteNumber = dict["noteNumber"] as? Int {
      return .noteOnRequest(noteNumber: noteNumber)
    }
  case "noteOffRequest":
    if let noteNumber = dict["noteNumber"] as? Int {
      return .noteOffRequest(noteNumber: noteNumber)
    }
  //
  case "rpcReadFileRequest":
    if let rpcId = dict["rpcId"] as? Int,
      let path = dict["path"] as? String,
      let skipIfNotExists = dict["skipIfNotExists"] as? Bool
    {
      return .rpcReadFileRequest(rpcId: rpcId, path: path, skipIfNotExists: skipIfNotExists)
    }
  case "rpcWriteFileRequest":
    if let rpcId = dict["rpcId"] as? Int,
      let path = dict["path"] as? String,
      let content = dict["content"] as? String,
      let append = dict["append"] as? Bool
    {
      return .rpcWriteFileRequest(rpcId: rpcId, path: path, content: content, append: append)
    }
  case "rpcDeleteFileRequest":
    if let rpcId = dict["rpcId"] as? Int,
      let path = dict["path"] as? String
    {
      return .rpcDeleteFileRequest(rpcId: rpcId, path: path)
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
  case .latestParametersVersion(let version):
    return [
      "type": "latestParametersVersion",
      "version": version,
    ]
  //
  case .rpcReadFileResponse(let rpcId, let success, let content):
    return [
      "type": "rpcReadFileResponse",
      "rpcId": rpcId,
      "success": success,
      "content": content,
    ]
  case .rpcWriteFileResponse(let rpcId, let success):
    return [
      "type": "rpcWriteFileResponse",
      "rpcId": rpcId,
      "success": success,
    ]
  case .rpcDeleteFileResponse(let rpcId, let success):
    return [
      "type": "rpcDeleteFileResponse",
      "rpcId": rpcId,
      "success": success,
    ]
  }
}

@MainActor
class BasicWebViewHub {
  private let flatParameterTree: FlatObservableParameters
  private let audioUnitPortal: AudioUnitPortal
  private let presetFilesIO: PresetFilesIO
  private let parameterMigrator: ParametersMigrator?

  private var webViewIo: WebViewIoProtocol?

  private lazy var valueTracker: ObservableValueTracker = ObservableValueTracker()
  private var portalSubscription: AnyCancellable?
  private var webViewIoSubscription: AnyCancellable?

  init(
    _ viewAccessibleResources: ViewAccessibleResources
  ) {
    logger.log("BasicWebViewHub init")
    self.flatParameterTree = FlatObservableParameters(
      parameterTree: viewAccessibleResources.parameterTree)
    self.audioUnitPortal = viewAccessibleResources.audioUnitPortal
    self.presetFilesIO = viewAccessibleResources.presetFilesIO
    self.parameterMigrator = viewAccessibleResources.parametersMigrator
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

  private func debugDumpCurrentParameters() {
    logger.log("Current Parameters in debugDumpCurrentParameters:")
    for (paramKey, paramEntry) in flatParameterTree.entries {
      logger.log("\(paramKey): \(paramEntry.value)")
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
      let latestParamVer = parameterMigrator?.latestParametersVersion ?? 0
      sendMessageToUI(.latestParametersVersion(version: latestParamVer))
      // self.debugDumpCurrentParameters()
      let params = flatParameterTree.entries.mapValues { $0.value }
      sendMessageToUI(.bulkSendParameters(params: params))
      startAUStateListeners()

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
    case .loadFullParameters(let parametersVersion, let parameters):
      logger.log("Received full parameters from UI: \(parameters)")
      audioUnitPortal.applyParametersState(parametersVersion, parameters)
    case .noteOnRequest(let noteNumber):
      logger.log("Note On Request from UI: \(noteNumber)")
      audioUnitPortal.noteOnFromUI(noteNumber, velocity: 1.0)
    case .noteOffRequest(let noteNumber):
      logger.log("Note Off Request from UI: \(noteNumber)")
      audioUnitPortal.noteOffFromUI(noteNumber)
    //
    case .rpcReadFileRequest(let rpcId, let path, let skipIfNotExists):
      do {
        let content = try presetFilesIO.readFile(path: path, skipIfNotExist: skipIfNotExists)
        sendMessageToUI(.rpcReadFileResponse(rpcId: rpcId, success: true, content: content))
      } catch {
        logger.log("RPC readFile error: \(error)")
        sendMessageToUI(.rpcReadFileResponse(rpcId: rpcId, success: false, content: ""))
      }
    case .rpcWriteFileRequest(let rpcId, let path, let content, let append):
      do {
        try presetFilesIO.writeFile(path: path, content: content, append: append)
        sendMessageToUI(.rpcWriteFileResponse(rpcId: rpcId, success: true))
      } catch {
        logger.log("RPC writeFile error: \(error)")
        sendMessageToUI(.rpcWriteFileResponse(rpcId: rpcId, success: false))
      }
    case .rpcDeleteFileRequest(let rpcId, let path):
      do {
        try presetFilesIO.deleteFile(path: path)
        sendMessageToUI(.rpcDeleteFileResponse(rpcId: rpcId, success: true))
      } catch {
        logger.log("RPC deleteFile error: \(error)")
        sendMessageToUI(.rpcDeleteFileResponse(rpcId: rpcId, success: false))
      }
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
    case .parametersVersionChanged(let parametersVersion):
      logger.log("Received parameters version changed event: \(parametersVersion)")
    }
  }

  func startAUStateListeners() {
    valueTracker.setReceiver { [weak self] key, value in
      self?.sendMessageToUI(.setParameter(paramKey: key, value: value))
    }
    for (paramKey, paramEntry) in flatParameterTree.entries {
      valueTracker.trackParameterValue(paramKey: paramKey, paramEntry: paramEntry)
    }

    portalSubscription?.cancel()
    portalSubscription = self.audioUnitPortal.events.sink { event in
      self.handlePortalEvent(event)
    }
  }

  func bindWebViewIo(webViewIo: WebViewIoProtocol) {
    self.webViewIo = webViewIo

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
