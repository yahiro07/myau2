import { CoreBridge } from "@/bridge/core-bridge";

type KvStorageAdapter = {
  readItem(key: string): Promise<string | null>;
  writeItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
};

export function createKvStorageAdapter(
  coreBridge: CoreBridge,
): KvStorageAdapter {
  let rpcIdCounter = 0;

  const pendingRpcResolvers: Record<
    number,
    (result: { success: boolean; content?: string }) => void
  > = {};

  coreBridge.assignReceiver((message) => {
    if (
      message.type === "rpcReadKvStorageItemResponse" ||
      message.type === "rpcWriteKvStorageItemResponse" ||
      message.type === "rpcDeleteKvStorageItemResponse"
    ) {
      const { rpcId, success } = message;
      const content =
        message.type === "rpcReadKvStorageItemResponse"
          ? message.value
          : undefined;
      const resolver = pendingRpcResolvers[rpcId];
      if (resolver) {
        resolver({ success, content });
        delete pendingRpcResolvers[rpcId];
      }
    }
  });

  return {
    async readItem(key) {
      const rpcId = rpcIdCounter++;
      coreBridge.sendMessage({
        type: "rpcReadKvStorageItem",
        key,
        rpcId,
      });
      return new Promise<string | null>((resolve, reject) => {
        pendingRpcResolvers[rpcId] = ({ success, content }) => {
          if (success) {
            resolve(content ?? null);
          } else {
            reject(new Error(`Failed to read kv storage item: ${key}`));
          }
        };
      });
    },
    async writeItem(key, value) {
      const rpcId = rpcIdCounter++;
      coreBridge.sendMessage({
        type: "rpcWriteKvStorageItem",
        key,
        rpcId,
        value,
      });
      return new Promise<void>((resolve, reject) => {
        pendingRpcResolvers[rpcId] = ({ success }) => {
          if (success) {
            resolve();
          } else {
            reject(new Error(`Failed to write kv storage item: ${key}`));
          }
        };
      });
    },
    async deleteItem(key) {
      const rpcId = rpcIdCounter++;
      coreBridge.sendMessage({
        type: "rpcDeleteKvStorageItem",
        key,
        rpcId,
      });
      return new Promise<void>((resolve, reject) => {
        pendingRpcResolvers[rpcId] = ({ success }) => {
          if (success) {
            resolve();
          } else {
            reject(new Error(`Failed to delete kv storage item: ${key}`));
          }
        };
      });
    },
  };
}
