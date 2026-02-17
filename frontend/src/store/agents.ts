import { createCoreBridge } from "@/bridge/core-bridge";
import { createEditorBridge } from "@/bridge/editor-bridge";
import { logger } from "@/bridge/logger";
import { createPresetManager } from "@/preset-manager/preset-manager";
import { createPluginAppPresetFilesIO } from "@/preset-manager/preset-manager-core-adapters";
import { createSharedKvsAdapter } from "@/preset-manager/shared-kvs-adapter";
import { createStateKvsAdapter } from "@/preset-manager/state-kvs-adapter";

function createAgents() {
  const coreBridge = createCoreBridge();
  const editorBridge = createEditorBridge(coreBridge);
  const stateKvs = createStateKvsAdapter(coreBridge);
  const presetFilesIO = createPluginAppPresetFilesIO(coreBridge);
  const sharedKvs = createSharedKvsAdapter(presetFilesIO);
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
    setup() {
      logger.log("initializing agents");
      const finalizers = [
        editorBridge.setup(),
        stateKvs.setup(),
        presetFilesIO.setup(),
      ];
      return () => {
        logger.log("finalizing agents");
        finalizers.forEach((fn) => {
          fn();
        });
      };
    },
    async initialLoad() {
      logger.log("agents initial loading...");
      coreBridge.sendMessage({ type: "uiLoaded" });
      await stateKvs.initialLoad();
      await sharedKvs.initialLoad();
      await presetManager.loadPresetList();
      logger.log("agents initial loading... done");
    },
  };
}
export const agents = createAgents();
