import { SynthesisInputMessage } from "@/bridge/dsp-dev-support/worklet-types";
import { DSPCore } from "../../../../dsp-dev/definitions/dsp_core_interface";
import { createDSPCoreInstance } from "../../../../dsp-dev/synthesizer_root";

function createProcessorClass() {
  return class extends AudioWorkletProcessor {
    private dspCore: DSPCore;
    private maxFrameLength = 0;
    private paramCodeMap: Record<string, number> = {};
    constructor() {
      super();
      this.dspCore = createDSPCoreInstance();
      this.port.onmessage = (event: { data: SynthesisInputMessage }) => {
        const { type } = event.data;
        if (type === "setParameter") {
          const { identifier, value } = event.data;
          let paramCode = this.paramCodeMap[identifier];
          if (!paramCode) {
            //簡易実装のためインラインでキーを取得してキャッシュ
            //C++の実装では事前に非オーディオスレッドで全パラメタのキーを取得する
            paramCode = this.paramCodeMap[identifier] =
              this.dspCore.mapParameterCode(identifier);
          }
          this.dspCore.setParameter(paramCode, value);
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
      //Workletではprocess()内でしかバッファ長がわからないのでここでprepareを呼ぶ
      //C++の実装では事前に非オーディオスレッドでprepareを呼ぶ想定
      if (bufferL.length > this.maxFrameLength) {
        this.dspCore.prepare(globalThis.sampleRate, bufferL.length);
        this.maxFrameLength = bufferL.length;
      }
      if (bufferR) {
        bufferL.fill(0);
        bufferR.fill(0);
        this.dspCore.process(bufferL, bufferR, bufferL.length);
      } else {
        bufferL.fill(0);
        this.dspCore.process(bufferL, bufferL, bufferL.length);
      }
      return true;
    }
  };
}

registerProcessor("my-processor", createProcessorClass());
