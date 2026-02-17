import { createCoreBridge } from "@/bridge/core-bridge";
import { createEditorBridge } from "@/bridge/editor-bridge";
import { logger } from "@/bridge/logger";
import { createPresetManager } from "@/preset-manager/preset-manager";
import { createPluginAppPresetFilesIO } from "@/preset-manager/preset-manager-core-adapters";
import { createSharedKvsAdapter } from "@/preset-manager/shared-kvs-adapter";
import { createStateKvsAdapter } from "@/preset-manager/state-kvs-adapter";

function createAgents() {
  const coreBridge = createCoreBridge();
  const stateKvs = createStateKvsAdapter(coreBridge);
  const presetFilesIO = createPluginAppPresetFilesIO(coreBridge);
  const sharedKvs = createSharedKvsAdapter(presetFilesIO);
  const editorBridge = createEditorBridge(coreBridge);
  const presetManager = createPresetManager(
    coreBridge,
    stateKvs,
    presetFilesIO,
  );
  return {
    coreBridge,
    stateKvs,
    sharedKvs,
    editorBridge,
    presetManager,
    async initialize() {
      logger.log("Initializing agents...");
      await stateKvs.initialize();
      await sharedKvs.initialize();
      await presetManager.loadPresetList();
      logger.log("Initializing agents... done");
    },
  };
}
export const agents = createAgents();
