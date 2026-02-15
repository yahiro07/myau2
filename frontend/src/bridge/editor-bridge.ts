import { useEffect } from "react";
import { logger } from "@/bridge/logger";
import {
  defaultSynthParameters,
  ParameterKey,
  SynthParametersSuit,
} from "@/store/parameters";
import { store } from "@/store/store";

type MessageFromUI =
  | { type: "uiLoaded" }
  | { type: "beginParameterEdit"; paramKey: string }
  | { type: "endParameterEdit"; paramKey: string }
  | { type: "setParameter"; paramKey: string; value: number }
  | { type: "noteOnRequest" | "noteOffRequest"; noteNumber: number };

type MessageFromApp =
  | { type: "setParameter"; paramKey: string; value: number }
  | { type: "bulkSetParameters"; parameters: Record<string, number> }
  | { type: "hostNoteOn"; noteNumber: number; velocity: number }
  | { type: "hostNoteOff"; noteNumber: number };

type MessageReceiver = (msg: MessageFromApp) => void;

type CoreBridge = {
  sendMessage: (msg: MessageFromUI) => void;
  assignReceiver: (receiver: MessageReceiver) => void;
  assertUiLoaded: () => void;
};

const globalThisTyped = globalThis as unknown as {
  webkit?: {
    messageHandlers: {
      putMessageFromUI: { postMessage: (msg: MessageFromUI) => void };
    };
  };
  putMessageFromApp?: (msg: MessageFromApp) => void;
};

function createCoreBridge(): CoreBridge {
  function sendMessageToApp(msg: MessageFromUI) {
    try {
      const wk = globalThisTyped.webkit;
      if (!wk) {
        console.warn("No webkit messageHandlers found");
        return;
      }
      wk.messageHandlers.putMessageFromUI.postMessage(msg);
    } catch (e) {
      console.log(e);
    }
  }

  let receiver: MessageReceiver | undefined;

  globalThisTyped.putMessageFromApp = (msg: MessageFromApp) => {
    logger.log(`command received ${JSON.stringify(msg)}`);
    receiver?.(msg);
  };

  return {
    sendMessage: sendMessageToApp,
    assignReceiver(_receiver) {
      receiver = _receiver;
    },
    assertUiLoaded() {
      sendMessageToApp({ type: "uiLoaded" });
    },
  };
}

function setupEditorBridge() {
  const coreBridge = createCoreBridge();

  let isReceiving = false;

  const parameterKeys = new Set(Object.keys(defaultSynthParameters));

  let editTargetSent: ParameterKey | undefined;

  //ストアの値を購読して変更があったときに本体に通知する
  store.subscribe((attrs) => {
    if (isReceiving) return;

    const { editTarget, ...paramAttrs } = attrs;

    if (editTarget !== undefined) {
      if (editTarget !== null) {
        coreBridge.sendMessage({
          type: "beginParameterEdit",
          paramKey: editTarget,
        });
        editTargetSent = editTarget;
      } else if (editTargetSent) {
        coreBridge.sendMessage({
          type: "endParameterEdit",
          paramKey: editTargetSent,
        });
        editTargetSent = undefined;
      }
    }

    for (const [key, value] of Object.entries(paramAttrs)) {
      if (
        parameterKeys.has(key) &&
        (typeof value === "number" || typeof value === "boolean")
      ) {
        const sendingValue =
          typeof value === "boolean" ? (value ? 1 : 0) : value;

        logger.log("sending parameter change to app", { key, sendingValue });
        coreBridge.sendMessage({
          type: "setParameter",
          paramKey: key,
          value: sendingValue,
        });
      }
    }
  });

  function affectParameterToStore(paramKey: string, value: number) {
    if (parameterKeys.has(paramKey)) {
      const paramType =
        defaultSynthParameters[paramKey as keyof SynthParametersSuit];
      const castedValue = typeof paramType === "boolean" ? value >= 0.5 : value;
      store.mutations.assigns({ [paramKey]: castedValue });
    } else {
      logger.log("unknown parameter key from app:", paramKey);
    }
  }

  coreBridge.assignReceiver((msg) => {
    //本体からパラメタを受け取ってstoreを更新したときにもsubscribeのコールバックが
    //呼ばれるので、そこで値を送り返さないようにフラグを立てて処理を抑制する
    isReceiving = true;
    logger.log("message from app", { msg });
    if (msg.type === "setParameter") {
      const { paramKey, value } = msg;
      affectParameterToStore(paramKey, value);
    } else if (msg.type === "bulkSetParameters") {
      for (const [paramKey, value] of Object.entries(msg.parameters)) {
        //store.mutations.*はバッチ化で単一の更新にまとめるので連続で多数呼んでよい
        affectParameterToStore(paramKey, value);
      }
    } else if (msg.type === "hostNoteOn") {
      logger.log(`hostNoteOn: ${msg.noteNumber}, ${msg.velocity}`);
    } else if (msg.type === "hostNoteOff") {
      logger.log(`hostNoteOff: ${msg.noteNumber}`);
    }
    //snap-storeの状態を更新したあと、別タスクでsubscribeのコールバックが呼ばれるので
    //これが終わった後にisReceivingをfalseにする(queueMicrotaskはFIFO順で処理される)
    queueMicrotask(() => {
      isReceiving = false;
    });
  });

  coreBridge.assertUiLoaded();
}

export function useEditorBridge() {
  useEffect(setupEditorBridge, []);
}
