import { createWorkletNodeWrapper } from "./worklet-node-wrapper";
import { WorkletInputMessage, WorkletWrapper } from "./worklet-types";
import workletUrl from "./worklet.ts?worker&url";

export function createDspCoreWorkletWrapper(): WorkletWrapper {
  const _navigator = navigator as { audioSession?: { type: string } };
  if (_navigator.audioSession) {
    _navigator.audioSession.type = "playback";
  }
  const audioContext = new AudioContext();

  const nodeWrapper = createWorkletNodeWrapper<WorkletInputMessage>(
    audioContext,
    workletUrl,
  );
  nodeWrapper.outputNode.connect(audioContext.destination);

  void nodeWrapper.initialize();

  return {
    setParameter(id: number, value: number) {
      nodeWrapper.sendMessage({ type: "setParameter", id, value });
    },
    noteOn(noteNumber: number, velocity: number) {
      nodeWrapper.sendMessage({ type: "noteOn", noteNumber, velocity });
    },
    noteOff(noteNumber: number) {
      nodeWrapper.sendMessage({ type: "noteOff", noteNumber });
    },
  };
}
