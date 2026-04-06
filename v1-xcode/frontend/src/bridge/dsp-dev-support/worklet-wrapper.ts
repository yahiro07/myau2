import { createWorkletNodeWrapper } from "@/bridge/dsp-dev-support/worklet-node-wrapper";
import {
  SynthesisInputMessage,
  SynthesizerRoot,
} from "@/bridge/dsp-dev-support/worklet-types";
import workletUrl from "./worklet.ts?worker&url";

export function createSynthesizerRootWithWorklet(): SynthesizerRoot {
  const _navigator = navigator as { audioSession?: { type: string } };
  if (_navigator.audioSession) {
    _navigator.audioSession.type = "playback";
  }
  const audioContext = new AudioContext();

  const workletWrapper = createWorkletNodeWrapper<SynthesisInputMessage>(
    audioContext,
    workletUrl,
  );
  workletWrapper.outputNode.connect(audioContext.destination);

  void workletWrapper.initialize();

  return {
    setParameter(identifier: string, value: number) {
      workletWrapper.sendMessage({ type: "setParameter", identifier, value });
    },
    noteOn(noteNumber: number, velocity: number) {
      workletWrapper.sendMessage({ type: "noteOn", noteNumber, velocity });
    },
    noteOff(noteNumber: number) {
      workletWrapper.sendMessage({ type: "noteOff", noteNumber });
    },
  };
}
