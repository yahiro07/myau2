import { SynthesisInputMessage } from "@/bridge/dsp-dev-support/worklet-types";
import { DSPCore } from "../../../../dsp-dev/definitions/dsp_core_interface";
import { createDSPCoreInstance } from "../../../../dsp-dev/synthesizer_root";

function createProcessorClass() {
  return class extends AudioWorkletProcessor {
    private dspCore: DSPCore;
    private maxFrameLength = 0;
    constructor() {
      super();
      this.dspCore = createDSPCoreInstance();
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
      //Workletではprocess()内でしかバッファ長がわからないのでここでprepareを呼ぶ
      //C++の実装では事前に非オーディオスレッドでprepareを呼ぶ想定
      if (bufferL.length > this.maxFrameLength) {
        this.dspCore.prepare(globalThis.sampleRate, bufferL.length);
        this.maxFrameLength = bufferL.length;
      }
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
