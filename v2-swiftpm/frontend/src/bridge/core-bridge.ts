import { logger } from "@/bridge/logger";
import { MessageFromApp, MessageFromUi } from "@/bridge/message-types";

export type CoreBridge = {
  sendMessage: (msg: MessageFromUi) => void;
  subscribe: (listener: (msg: MessageFromApp) => void) => () => void;
};

const windowTyped = window as unknown as {
  webkit?: {
    messageHandlers: {
      pluginEditor?: {
        postMessage: (msg: string | object) => void;
      };
    };
  };
  pluginEditorCallback?: (msg: MessageFromApp) => void;
};

export function createCoreBridge(): CoreBridge {
  const webkit = windowTyped.webkit;
  if (!webkit) {
    console.warn("incompatible environment");
  }

  function sendMessage(msg: MessageFromUi) {
    try {
      logger.log("⇠ui", msg);
      webkit?.messageHandlers.pluginEditor?.postMessage(msg);
    } catch (e) {
      console.log(e);
    }
  }

  type CoreBridgeMessageListener = (msg: MessageFromApp) => void;
  const listeners: Set<CoreBridgeMessageListener> = new Set();

  windowTyped.pluginEditorCallback ??= (msg: MessageFromApp) => {
    logger.log("⇢ui", msg);
    listeners.forEach((fn) => {
      fn(msg);
    });
  };

  function subscribe(listener: CoreBridgeMessageListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    sendMessage,
    subscribe,
  };
}
