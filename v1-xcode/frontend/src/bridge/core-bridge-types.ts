export type MessageFromUI =
  | { type: "putLogItem"; timeStamp: number; kind: string; message: string }
  | { type: "uiLoaded" }
  | { type: "beginParameterEdit"; paramKey: string }
  | { type: "endParameterEdit"; paramKey: string }
  | { type: "setParameter"; paramKey: string; value: number }
  | {
      type: "loadFullParameters";
      parametersVersion: number;
      parameters: Record<string, number>;
    }
  | { type: "noteOnRequest" | "noteOffRequest"; noteNumber: number }
  //
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

export type MessageFromApp =
  | { type: "setParameter"; paramKey: string; value: number }
  | { type: "bulkSendParameters"; parameters: Record<string, number> }
  | { type: "hostNoteOn"; noteNumber: number; velocity: number }
  | { type: "hostNoteOff"; noteNumber: number }
  | { type: "standaloneAppFlag" }
  | { type: "latestParametersVersion"; version: number }
  //
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

export type CoreBridgeMessageReceiver = (msg: MessageFromApp) => void;

export type CoreBridge = {
  sendMessage: (msg: MessageFromUI) => void;
  assignReceiver: (receiver: CoreBridgeMessageReceiver) => () => void;
};
