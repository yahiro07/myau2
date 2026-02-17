import { CoreBridge, MessageFromUI } from "@/bridge/core-bridge";

//the data is stored in AudioUnit extension's state object
export type StateKvsAdapter = {
  initialize(): Promise<void>;
  read(key: string): string | undefined;
  write(key: string, value: string): void;
  delete(key: string): void;
};

function createStateKvsItemsFetcher(coreBridge: CoreBridge) {
  let rpcIdCounter = 0;

  const pendingRpcResolvers: Record<
    number,
    (result: { items?: Record<string, string> }) => void
  > = {};

  coreBridge.assignReceiver((message) => {
    if (message.type === "rpcLoadStateKvsItemsResponse") {
      const { rpcId, items } = message;
      const resolver = pendingRpcResolvers[rpcId];
      if (resolver) {
        resolver({ items });
        delete pendingRpcResolvers[rpcId];
      }
    }
  });

  function executeRpc(
    msg: MessageFromUI & { rpcId: number },
  ): Promise<{ items?: Record<string, string> }> {
    coreBridge.sendMessage(msg);
    return new Promise((resolve) => {
      pendingRpcResolvers[msg.rpcId] = resolve;
    });
  }

  return {
    async fetchStateKvsItems() {
      const res = await executeRpc({
        type: "rpcLoadStateKvsItems",
        rpcId: rpcIdCounter++,
      });
      return res.items ?? {};
    },
  };
}

export function createStateKvsAdapter(coreBridge: CoreBridge): StateKvsAdapter {
  const localCache: Record<string, string> = {};
  const initialItemsFetcher = createStateKvsItemsFetcher(coreBridge);

  return {
    async initialize() {
      const items = await initialItemsFetcher.fetchStateKvsItems();
      Object.assign(localCache, items);
    },
    read(key) {
      return localCache[key];
    },
    write(key, value) {
      localCache[key] = value;
      void coreBridge.sendMessage({ type: "writeStateKvsItem", key, value });
    },
    delete(key) {
      delete localCache[key];
      void coreBridge.sendMessage({ type: "deleteStateKvsItem", key });
    },
  };
}
