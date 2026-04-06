import { createDspCoreInstance, IDspCore } from "../../dsp-dev/dsp-core-entry";
import { WorkletInputMessage } from "./worklet-types";

function createProcessorClass() {
  return class extends AudioWorkletProcessor {
    private dspCore: IDspCore;
    private maxFrameLength = 0;
    constructor() {
      super();
      this.dspCore = createDspCoreInstance();
      this.port.onmessage = (event: { data: WorkletInputMessage }) => {
        const { type } = event.data;
        if (type === "setParameter") {
          const { id, value } = event.data;
          this.dspCore.setParameter(id, value);
        } else if (type === "noteOn") {
          const { noteNumber, velocity } = event.data;
          this.dspCore.noteOn(noteNumber, velocity);
        } else if (type === "noteOff") {
          const { noteNumber } = event.data;
          this.dspCore.noteOff(noteNumber);
        }
      };
    }
    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
      const bufferL = outputs[0][0];
      const bufferR = outputs[0][1];
      // Since the buffer length is only known within `process()` in a Worklet, `prepareProcessing` is called here
      // In the C++ implementation, it is assumed that `prepareProcessing` is called in advance on a non-audio thread
      if (bufferL.length > this.maxFrameLength) {
        this.dspCore.prepareProcessing(globalThis.sampleRate, bufferL.length);
        this.maxFrameLength = bufferL.length;
      }
      if (bufferR) {
        bufferL.fill(0);
        bufferR.fill(0);
        this.dspCore.processAudio(bufferL, bufferR, bufferL.length);
      } else {
        bufferL.fill(0);
        this.dspCore.processAudio(bufferL, bufferL, bufferL.length);
      }
      return true;
    }
  };
}

registerProcessor("my-processor", createProcessorClass());
