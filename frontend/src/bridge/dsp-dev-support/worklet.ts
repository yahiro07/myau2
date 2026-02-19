import { SynthesisInputMessage } from "@/bridge/dsp-dev-support/worklet-types";
import { createDSPCoreInstance } from "../../../../dsp-dev/hello";

function createProcessorClass() {
  return class extends AudioWorkletProcessor {
    private dspCore = createDSPCoreInstance();
    constructor() {
      super();
      this.port.onmessage = (event: { data: SynthesisInputMessage }) => {
        const { type } = event.data;
        if (type === "setParameter") {
          this.dspCore.setParameter(event.data.address, event.data.value);
        } else if (type === "noteOn") {
          this.dspCore.noteOn(event.data.noteNumber, event.data.velocity);
        } else if (type === "noteOff") {
          this.dspCore.noteOff(event.data.noteNumber);
        }
      };
    }
    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
      const bufferL = outputs[0][0];
      const bufferR = outputs[0][1];
      if (bufferR) {
        this.dspCore.process(bufferL, bufferR, bufferL.length);
        bufferR.set(bufferL);
      } else {
        this.dspCore.process(bufferL, bufferL, bufferL.length);
      }
      return true;
    }
  };
}

registerProcessor("my-processor", createProcessorClass());
