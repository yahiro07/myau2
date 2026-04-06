import {
  CoreBridge,
  CoreBridgeMessageReceiver,
  MessageFromApp,
  MessageFromUI,
} from "@/bridge/core-bridge-types";
import { logger } from "@/bridge/logger";
import { removeArrayItem } from "@/utils/array-utils";

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
      logger.log(`send ${JSON.stringify(msg)}`);
      webkit?.messageHandlers.putMessageFromUI.postMessage(msg);
    } catch (e) {
      console.log(e);
    }
  }

  const receivers: CoreBridgeMessageReceiver[] = [];

  function assignReceiver(receiver: CoreBridgeMessageReceiver) {
    globalThisTyped.putMessageFromApp ??= (msg: MessageFromApp) => {
      logger.log(`recv ${JSON.stringify(msg)}`);
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
