import { logger } from "@/bridge/logger";

export function createWorkletNodeWrapper<TMessage extends object>(
  audioContext: AudioContext,
  workerUrl: string,
) {
  const outputNode = audioContext.createGain();
  outputNode.gain.value = 1;

  let worklet: AudioWorkletNode | undefined;
  const messageQueue: TMessage[] = [];
  let loaded = false;

  async function loadWorklet() {
    try {
      await audioContext.audioWorklet.addModule(workerUrl);
      worklet = new AudioWorkletNode(audioContext, "my-processor", {
        channelCount: 2,
      });
      worklet.connect(outputNode);
      for (const message of messageQueue) {
        worklet.port.postMessage(message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      loaded = true;
      messageQueue.length = 0;
    }
  }

  async function initialize() {
    await loadWorklet();
  }

  async function resumeIfNeed() {
    const st = audioContext.state;
    if (st !== "running" && st !== "closed") {
      try {
        await audioContext.resume();
      } catch (_) {}
    }
  }

  return {
    outputNode,
    initialize,
    resumeIfNeed,
    sendMessage(message: TMessage) {
      if (worklet) {
        worklet.port.postMessage(message);
      } else if (!loaded) {
        messageQueue.push(message);
      } else {
        logger.warn("message ignored, worklet is not ready");
      }
    },
  };
}
