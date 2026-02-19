import {
  CoreBridge,
  CoreBridgeMessageReceiver,
  MessageFromUI,
} from "@/bridge/core-bridge-types";
import { createSynthesizerRootWithWorklet } from "@/bridge/dsp-dev-support/worklet-wrapper";
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
  logger.warn("using development bridge");

  const dummyDataProvider = createOnDummyDataProvider();
  const synthesizerRoot = createSynthesizerRootWithWorklet();

  function sendMessage(msg: MessageFromUI) {
    logger.log("send", msg);
    dummyDataProvider.handleMessage(msg);

    if (msg.type === "uiLoaded") {
    } else if (msg.type === "setParameter") {
      synthesizerRoot.setParameter(
        //msg.paramKey,
        123, //todo
        msg.value,
      );
    } else if (msg.type === "noteOnRequest") {
      synthesizerRoot.noteOn(msg.noteNumber, 1);
    } else if (msg.type === "noteOffRequest") {
      synthesizerRoot.noteOff(msg.noteNumber);
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
