import {
  CoreBridge,
  CoreBridgeMessageReceiver,
  MessageFromUI,
} from "@/bridge/core-bridge-types";
import { logger } from "@/bridge/logger";
import { removeArrayItem } from "@/utils/array-utils";

//development bridge for DSP prototyping.

export function createCoreBridgeDev(): CoreBridge {
  function sendMessage(msg: MessageFromUI) {
    try {
      logger.log(`send ${JSON.stringify(msg)}`);
    } catch (e) {
      console.log(e);
    }
  }

  const receivers: CoreBridgeMessageReceiver[] = [];

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
