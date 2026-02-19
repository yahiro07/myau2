import { defaultSynthParameters, SynthParametersSuit } from "./defs";
import { DSPCore } from "./dsp_core_interface";
import { seqNumbers } from "./funcs/array_utils";
import {
  applyBufferGain,
  applyBufferGainRms,
  copyBuffer,
  writeBuffer,
} from "./funcs/buffer_functions";
import { applyBufferSoftClip } from "./funcs/clippers";
import { createVoiceState, VoiceState } from "./state_bus";
import {
  createAmpEg,
  createFilter,
  createLfo,
  createModEg,
  createOscillator,
  createVoicingAmp,
} from "./synthesis_modules";

type SynthesizerVoice = {
  voiceState: VoiceState;
  noteOn(noteNumber: number): void;
  noteOff(): void;
  processSamples(buffer: Float32Array): void;
};

function createSynthesizerVoice(
  synthParameters: SynthParametersSuit,
  sampleRate: number,
): SynthesizerVoice {
  const voiceState = createVoiceState(synthParameters, sampleRate);
  const osc1 = createOscillator(voiceState, "osc1");
  const osc2 = createOscillator(voiceState, "osc2");
  const filter = createFilter(voiceState);
  const ampEg = createAmpEg(voiceState);
  const modEg = createModEg(voiceState);
  const lfo = createLfo(voiceState);
  const voicingAmp = createVoicingAmp(voiceState);

  return {
    voiceState,
    noteOn(noteNumber: number) {
      voiceState.noteNumber = noteNumber;
      voiceState.gateOn = true;
      voiceState.gateOnUptime = 0;
      voiceState.gateOffUptime = 0;
      voiceState.randomSeed = Math.random();
      osc1.reset();
      osc2.reset();
      filter.reset();
      lfo.reset();
    },
    noteOff() {
      voiceState.gateOn = false;
      voiceState.gateOffUptime = 0;
    },
    processSamples(buffer: Float32Array) {
      const len = buffer.length;
      ampEg.advance();
      modEg.advance();
      lfo.advance(len);

      osc1.process(buffer);
      osc2.process(buffer);
      applyBufferGain(buffer, 0.5);
      filter.processSamples(buffer);
      voicingAmp.process(buffer);

      const timeElapsed = buffer.length / voiceState.sampleRate;
      if (voiceState.gateOn) {
        voiceState.gateOnUptime += timeElapsed;
      } else {
        voiceState.gateOffUptime += timeElapsed;
      }
    },
  };
}

function findNextVoice(voices: SynthesizerVoice[]) {
  //gateOffの状態でgetOffUptimeが最も大きい(発音停止が最も古い)voiceを返す
  let index = -1;
  for (let i = 0; i < voices.length; i++) {
    if (!voices[i].voiceState.gateOn) {
      if (index === -1) {
        index = i;
      } else {
        if (
          voices[i].voiceState.gateOffUptime >
          voices[index].voiceState.gateOffUptime
        ) {
          index = i;
        }
      }
    }
  }
  if (index !== -1) {
    return voices[index];
  }
  //すべてのvoiceがgateOnの場合
  //gateOnUptimeが最も大きい(発音開始がもっとも古い)voiceを返す
  index = 0;
  for (let i = 0; i < voices.length; i++) {
    if (
      voices[i].voiceState.gateOnUptime > voices[index].voiceState.gateOnUptime
    ) {
      index = i;
    }
  }
  return voices[index];
}

export function createSynthesizerRoot(sampleRate: number): DSPCore {
  const synthParameters: SynthParametersSuit = { ...defaultSynthParameters };
  const voices = seqNumbers(6).map(() =>
    createSynthesizerVoice(synthParameters, sampleRate),
  );

  let workBuffer: Float32Array | undefined;

  return {
    setParametersVersion(_version) {},
    // setParameters(params: Partial<SynthParametersSuit>) {
    //   Object.assign(synthParameters, params);
    // },
    setParameter(_address, _value) {
      //TODO
    },
    noteOn(noteNumber, _velocity) {
      const nextVoice = findNextVoice(voices);
      if (nextVoice) {
        nextVoice.noteOn(noteNumber);
      }
    },
    noteOff(noteNumber) {
      for (const voice of voices) {
        if (voice.voiceState.noteNumber === noteNumber) {
          voice.noteOff();
        }
      }
    },
    process(bufferLeft, bufferRight, _len) {
      if (!workBuffer || workBuffer.length !== bufferLeft.length) {
        //オーディオ処理中にバッファを確保 WebAudioの場合は許容,C++の実装では事前確保にする
        workBuffer = new Float32Array(bufferLeft.length);
      }
      bufferLeft.fill(0);
      for (const voice of voices) {
        workBuffer.fill(0);
        voice.processSamples(workBuffer);
        writeBuffer(bufferLeft, workBuffer);
      }
      applyBufferGainRms(bufferLeft, voices.length);
      applyBufferSoftClip(bufferLeft);
      copyBuffer(bufferRight, bufferLeft);
    },
  };
}
