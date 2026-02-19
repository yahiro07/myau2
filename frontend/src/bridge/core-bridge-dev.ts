import {
  CoreBridge,
  CoreBridgeMessageReceiver,
  MessageFromUI,
} from "@/bridge/core-bridge-types";
import { logger } from "@/bridge/logger";
import { removeArrayItem } from "@/utils/array-utils";

//development bridge for DSP prototyping.

function createOnDummyDataProvider() {
  let receiver: CoreBridgeMessageReceiver | undefined;

  return {
    handleMessage(msg: MessageFromUI) {
      if (msg.type === "uiLoaded") {
      } else if (msg.type === "rpcLoadStateKvsItems") {
        receiver?.({
          type: "rpcLoadStateKvsItemsResponse",
          rpcId: msg.rpcId,
          items: {},
        });
      }
    },
    subscribe(fn: CoreBridgeMessageReceiver) {
      receiver = fn;
    },
  };
}

export function createCoreBridgeDev(): CoreBridge {
  const dummyDataProvider = createOnDummyDataProvider();

  logger.warn("using development bridge");

  function sendMessage(msg: MessageFromUI) {
    logger.log("send", msg);
    dummyDataProvider.handleMessage(msg);

    if (msg.type === "uiLoaded") {
    }
  }

  const receivers: CoreBridgeMessageReceiver[] = [];

  dummyDataProvider.subscribe((msg) => {
    logger.log("recv", msg);
    receivers.forEach((fn) => {
      fn(msg);
    });
  });

  function assignReceiver(receiver: CoreBridgeMessageReceiver) {
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
