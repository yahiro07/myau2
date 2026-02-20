import { CoreBridge } from "@/bridge/core-bridge-types";

// In production build, core-bridge-dev.ts is replaced with this dummy
// so as not to include DSP prototyping code in the final bundle.
export function createCoreBridgeDev(): CoreBridge {
  return {
    sendMessage: () => {
      throw new Error("this is a dummy bridge. invalid invocation");
    },
    assignReceiver: () => {
      throw new Error("this is a dummy bridge. invalid invocation");
    },
  };
}
