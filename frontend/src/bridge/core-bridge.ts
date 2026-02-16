import { logger } from "@/bridge/logger";
import { removeArrayItem } from "@/utils/array-utils";

export type MessageFromUI =
  | { type: "uiLoaded" }
  | { type: "beginParameterEdit"; paramKey: string }
  | { type: "endParameterEdit"; paramKey: string }
  | { type: "setParameter"; paramKey: string; value: number }
  | {
      type: "loadFullParameters";
      parametersVersion: number;
      parameters: Record<string, number>;
    }
  | { type: "noteOnRequest" | "noteOffRequest"; noteNumber: number };

export type MessageFromApp =
  | { type: "setParameter"; paramKey: string; value: number }
  | { type: "bulkSendParameters"; parameters: Record<string, number> }
  | { type: "hostNoteOn"; noteNumber: number; velocity: number }
  | { type: "hostNoteOff"; noteNumber: number }
  | { type: "standaloneAppFlag" }
  | { type: "latestParametersVersion"; version: number };

type MessageReceiver = (msg: MessageFromApp) => void;

export type CoreBridge = {
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

  const receivers: MessageReceiver[] = [];

  function assignReceiver(receiver: MessageReceiver) {
    globalThisTyped.putMessageFromApp ??= (msg: MessageFromApp) => {
      logger.log(`command received ${JSON.stringify(msg)}`);
      receivers.forEach((fn) => {
        fn(msg);
      });
    };
    receivers.push(receiver);

    return () => {
      removeArrayItem(receivers, receiver);
    };
  }

  return {
    sendMessage,
    assignReceiver,
  };
}
