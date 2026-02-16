import { createCoreBridge } from "@/bridge/core-bridge";
import { createEditorBridge } from "@/bridge/editor-bridge";
import { createPresetManager } from "@/preset-manager/preset-manager";

function createAgents() {
  const coreBridge = createCoreBridge();
  const editorBridge = createEditorBridge(coreBridge);
  const presetManager = createPresetManager(coreBridge);
  return {
    coreBridge,
    editorBridge,
    presetManager,
  };
}
export const agents = createAgents();
