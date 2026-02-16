import { logger } from "@/bridge/logger";

export type MessageFromUI =
  | { type: "uiLoaded" }
  | { type: "beginParameterEdit"; paramKey: string }
  | { type: "endParameterEdit"; paramKey: string }
  | { type: "setParameter"; paramKey: string; value: number }
  | { type: "bulkSetParameters"; parameters: Record<string, number> }
  | { type: "noteOnRequest" | "noteOffRequest"; noteNumber: number };

export type MessageFromApp =
  | { type: "setParameter"; paramKey: string; value: number }
  | { type: "bulkSetParameters"; parameters: Record<string, number> }
  | { type: "hostNoteOn"; noteNumber: number; velocity: number }
  | { type: "hostNoteOff"; noteNumber: number }
  | { type: "standaloneAppFlag" };

type MessageReceiver = (msg: MessageFromApp) => void;

type CoreBridge = {
  sendMessage: (msg: MessageFromUI) => void;
  assignReceiver: (receiver: MessageReceiver) => () => void;
};

const globalThisTyped = globalThis as unknown as {
  webkit?: {
    messageHandlers: {
      putMessageFromUI: { postMessage: (msg: MessageFromUI) => void };
    };
  };
  putMessageFromApp?: (msg: MessageFromApp) => void;
};

export function createCoreBridge(): CoreBridge {
  const webkit = globalThisTyped.webkit;
  if (!webkit) {
    console.warn("incompatible environment");
  }

  function sendMessage(msg: MessageFromUI) {
    try {
      webkit?.messageHandlers.putMessageFromUI.postMessage(msg);
    } catch (e) {
      console.log(e);
    }
  }

  function assignReceiver(_receiver: MessageReceiver) {
    let receiver = _receiver as MessageReceiver | undefined;
    globalThisTyped.putMessageFromApp = (msg: MessageFromApp) => {
      logger.log(`command received ${JSON.stringify(msg)}`);
      receiver?.(msg);
    };

    return () => {
      receiver = undefined;
    };
  }

  return {
    sendMessage,
    assignReceiver,
  };
}
