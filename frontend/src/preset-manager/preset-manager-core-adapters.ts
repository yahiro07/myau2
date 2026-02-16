import { CoreBridge } from "@/bridge/core-bridge";
import { PresetFilesIO } from "@/preset-manager/preset-manager-core-port-types";

export function createPluginAppPresetFilesIO(
  coreBridge: CoreBridge,
): PresetFilesIO {
  let rpcIdCounter = 0;

  const pendingRpcResolvers: Record<
    number,
    (result: { success: boolean; content?: string }) => void
  > = {};

  coreBridge.assignReceiver((message) => {
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

  return {
    async readFile(path, options) {
      const rpcId = rpcIdCounter++;
      coreBridge.sendMessage({
        type: "rpcReadFileRequest",
        rpcId,
        path,
        skipIfNotExists: options?.skipIfNotExist ?? false,
      });
      return new Promise<string>((resolve, reject) => {
        pendingRpcResolvers[rpcId] = ({ success, content }) => {
          if (success && content !== undefined) {
            resolve(content);
          } else {
            reject(new Error(`Failed to read file: ${path}`));
          }
        };
      });
    },
    async writeFile(path, content, options) {
      const rpcId = rpcIdCounter++;
      coreBridge.sendMessage({
        type: "rpcWriteFileRequest",
        rpcId,
        path,
        content,
        append: options?.append ?? false,
      });
      return new Promise<void>((resolve, reject) => {
        pendingRpcResolvers[rpcId] = ({ success }) => {
          if (success) {
            resolve();
          } else {
            reject(new Error(`Failed to write file: ${path}`));
          }
        };
      });
    },
    async deleteFile(path) {
      const rpcId = rpcIdCounter++;
      coreBridge.sendMessage({
        type: "rpcDeleteFileRequest",
        rpcId,
        path,
      });
      return new Promise<void>((resolve, reject) => {
        pendingRpcResolvers[rpcId] = ({ success }) => {
          if (success) {
            resolve();
          } else {
            reject(new Error(`Failed to delete file: ${path}`));
          }
        };
      });
    },
  };
}

export function createOnMemoryPresetFilesIO(): PresetFilesIO {
  const fileItems: Record<string, string> = {};
  return {
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
