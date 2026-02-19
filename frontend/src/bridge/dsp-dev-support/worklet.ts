import { SynthesisInputMessage } from "@/bridge/dsp-dev-support/worklet-types";
import {
  dspDev_noteOff,
  dspDev_noteOn,
  dspDev_processSamples,
} from "../../../../dsp-dev/hello";

type DspCoreWrapper = {
  setParameter(address: number, value: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  processSamples(buffer: Float32Array): void;
};

function createDspCoreWrapper(): DspCoreWrapper {
  return {
    setParameter(_address, _value) {},
    noteOn(noteNumber, velocity) {
      dspDev_noteOn(noteNumber, velocity);
    },
    noteOff(noteNumber) {
      dspDev_noteOff(noteNumber);
    },
    processSamples(buffer) {
      dspDev_processSamples(buffer, buffer.length);
    },
  };
}

function createProcessorClass() {
  return class extends AudioWorkletProcessor {
    private dspCoreWrapper = createDspCoreWrapper();
    constructor() {
      super();
      this.port.onmessage = (event: { data: SynthesisInputMessage }) => {
        const { type } = event.data;
        if (type === "setParameter") {
          this.dspCoreWrapper.setParameter(
            event.data.address,
            event.data.value,
          );
        } else if (type === "noteOn") {
          this.dspCoreWrapper.noteOn(
            event.data.noteNumber,
            event.data.velocity,
          );
        } else if (type === "noteOff") {
          this.dspCoreWrapper.noteOff(event.data.noteNumber);
        }
      };
    }
    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
      const bufferLeft = outputs[0][0];
      const bufferRight = outputs[0][1];
      this.dspCoreWrapper.processSamples(bufferLeft);
      bufferRight?.set(bufferLeft);
      return true;
    }
  };
}

registerProcessor("my-processor", createProcessorClass());
