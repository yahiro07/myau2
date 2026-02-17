import { CoreBridge, MessageFromUI } from "@/bridge/core-bridge";
import { PresetFilesIO } from "@/preset-manager/preset-manager-core-port-types";
import { rpcIdCounter } from "@/preset-manager/rpc-id-counter";

export function createPluginAppPresetFilesIO(
  coreBridge: CoreBridge,
): PresetFilesIO {
  const pendingRpcResolvers: Record<
    number,
    (result: { success: boolean; content?: string }) => void
  > = {};

  function setupReceiver() {
    return coreBridge.assignReceiver((message) => {
      if (
        message.type === "rpcReadFileResponse" ||
        message.type === "rpcWriteFileResponse" ||
        message.type === "rpcDeleteFileResponse"
      ) {
        const { rpcId, success } = message;
        const content =
          message.type === "rpcReadFileResponse" ? message.content : undefined;
        const resolver = pendingRpcResolvers[rpcId];
        if (resolver) {
          resolver({ success, content });
          delete pendingRpcResolvers[rpcId];
        }
      }
    });
  }

  function executeRpc(
    msg: MessageFromUI & { rpcId: number },
  ): Promise<{ success: boolean; content?: string }> {
    coreBridge.sendMessage(msg);
    return new Promise((resolve) => {
      pendingRpcResolvers[msg.rpcId] = resolve;
    });
  }

  return {
    setup: setupReceiver,
    async readFile(path, options) {
      const res = await executeRpc({
        type: "rpcReadFileRequest",
        rpcId: rpcIdCounter.count++,
        path,
        skipIfNotExists: options?.skipIfNotExist ?? false,
      });
      if (res.success && res.content !== undefined) {
        return res.content;
      } else {
        throw new Error(`Failed to read file: ${path}`);
      }
    },
    async writeFile(path, content, options) {
      const res = await executeRpc({
        type: "rpcWriteFileRequest",
        rpcId: rpcIdCounter.count++,
        path,
        content,
        append: options?.append ?? false,
      });
      if (!res.success) {
        throw new Error(`Failed to write file: ${path}`);
      }
    },
    async deleteFile(path) {
      const res = await executeRpc({
        type: "rpcDeleteFileRequest",
        rpcId: rpcIdCounter.count++,
        path,
      });
      if (!res.success) {
        throw new Error(`Failed to delete file: ${path}`);
      }
    },
  };
}

export function createOnMemoryPresetFilesIO(): PresetFilesIO {
  const fileItems: Record<string, string> = {};
  return {
    setup() {
      return () => {};
    },
    async readFile(path) {
      const content = fileItems[path];
      if (!content) {
        throw new Error(`File not found: ${path}`);
      }
      return content;
    },
    async writeFile(path, content, options) {
      if (!options?.append) {
        fileItems[path] = content;
      } else {
        fileItems[path] ??= "";
        fileItems[path] += content;
      }
    },
    async deleteFile(path) {
      delete fileItems[path];
    },
  };
}
