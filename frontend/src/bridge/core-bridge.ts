import { logger } from "@/bridge/logger";
import { removeArrayItem } from "@/utils/array-utils";

type MessageFromUI_Base =
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

type MassagesFromApp_Base =
  | { type: "setParameter"; paramKey: string; value: number }
  | { type: "bulkSendParameters"; parameters: Record<string, number> }
  | { type: "hostNoteOn"; noteNumber: number; velocity: number }
  | { type: "hostNoteOff"; noteNumber: number }
  | { type: "standaloneAppFlag" }
  | { type: "latestParametersVersion"; version: number };

type MessageFromUI_FilesIO =
  | {
      type: "rpcReadFileRequest";
      rpcId: number;
      path: string;
      skipIfNotExists: boolean;
    }
  | {
      type: "rpcWriteFileRequest";
      rpcId: number;
      path: string;
      content: string;
      append: boolean;
    }
  | { type: "rpcDeleteFileRequest"; rpcId: number; path: string }
  | { type: "rpcLoadStateKvsItems"; rpcId: number }
  | { type: "writeStateKvsItem"; key: string; value: string }
  | { type: "deleteStateKvsItem"; key: string };

type MessageFromApp_FilesIO =
  | {
      type: "rpcReadFileResponse";
      rpcId: number;
      success: boolean;
      content: string;
    }
  | { type: "rpcWriteFileResponse"; rpcId: number; success: boolean }
  | { type: "rpcDeleteFileResponse"; rpcId: number; success: boolean }
  | {
      type: "rpcLoadStateKvsItemsResponse";
      rpcId: number;
      items?: Record<string, string>;
    };

export type MessageFromUI = MessageFromUI_Base | MessageFromUI_FilesIO;

export type MessageFromApp = MassagesFromApp_Base | MessageFromApp_FilesIO;

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
      logger.log(`sending ${JSON.stringify(msg)}`);
      webkit?.messageHandlers.putMessageFromUI.postMessage(msg);
    } catch (e) {
      console.log(e);
    }
  }

  const receivers: MessageReceiver[] = [];

  function assignReceiver(receiver: MessageReceiver) {
    globalThisTyped.putMessageFromApp ??= (msg: MessageFromApp) => {
      logger.log(`received ${JSON.stringify(msg)}`);
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
