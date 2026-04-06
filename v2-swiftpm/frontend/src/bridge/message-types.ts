export type MessageFromUi =
  | { type: "log"; timeStamp: number; logKind: string; message: string }
  | { type: "uiLoaded" }
  | { type: "beginEdit"; paramKey: string }
  | { type: "performEdit"; paramKey: string; value: number }
  | { type: "endEdit"; paramKey: string }
  | { type: "instantEdit"; paramKey: string; value: number }
  | { type: "noteOnRequest"; noteNumber: number }
  | { type: "noteOffRequest"; noteNumber: number }
  | {
      type: "loadFullParameters";
      parameters: Record<string, number>;
    }
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

export type CoreBridge = {
  sendMessage: (msg: MessageFromUi) => void;
  subscribe: (listener: (msg: MessageFromApp) => void) => () => void;
};
