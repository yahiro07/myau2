import { DSPCore } from "./definitions/dsp_core_interface";
import {
  calculateParameterIdentifierHash,
  parameterKeys,
} from "./definitions/parameter_keys";
import {
  defaultSynthParameters,
  SynthParametersSuit,
} from "./definitions/parameters";
import { createVoiceState, VoiceState } from "./definitions/state_bus";
import { seqNumbers } from "./functions/array_utils";
import {
  applyBufferGain,
  applyBufferGainRms,
  copyBuffer,
  writeBuffer,
} from "./functions/buffer_functions";
import { applyBufferSoftClip } from "./functions/clippers";
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
  prepare(sampleRate: number): void;
  noteOn(noteNumber: number): void;
  noteOff(): void;
  processSamples(buffer: Float32Array): void;
};

function createSynthesizerVoice(
  synthParameters: SynthParametersSuit,
): SynthesizerVoice {
  const voiceState = createVoiceState(synthParameters);
  const osc1 = createOscillator(voiceState, "osc1");
  const osc2 = createOscillator(voiceState, "osc2");
  const filter = createFilter(voiceState);
  const ampEg = createAmpEg(voiceState);
  const modEg = createModEg(voiceState);
  const lfo = createLfo(voiceState);
  const voicingAmp = createVoicingAmp(voiceState);

  return {
    voiceState,
    prepare(sampleRate: number) {
      voiceState.sampleRate = sampleRate;
      filter.setSampleRate(sampleRate);
    },
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
      if (!voiceState.sampleRate) return;

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

export function createSynthesizerRoot(): DSPCore {
  const synthParameters: SynthParametersSuit = { ...defaultSynthParameters };
  const voices = seqNumbers(6).map(() =>
    createSynthesizerVoice(synthParameters),
  );

  let workBuffer: Float32Array | undefined;

  return {
    setParametersVersion(_version) {},
    // setParameters(params: Partial<SynthParametersSuit>) {
    //   Object.assign(synthParameters, params);
    // },
    mapParameterKey(_address, identifier) {
      return calculateParameterIdentifierHash(identifier);
    },
    setParameter(paramKey, value) {
      //an example
      if (paramKey === parameterKeys.osc1Wave) {
        synthParameters.osc1Wave = value;
      }
    },
    prepare(sampleRate, _maxFrameLength) {
      for (const voice of voices) {
        voice.prepare(sampleRate);
      }
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
    process(bufferL, bufferR, _len) {
      if (!workBuffer || workBuffer.length !== bufferL.length) {
        //オーディオ処理中にバッファを確保 WebAudioの場合は許容,C++の実装では事前確保にする
        workBuffer = new Float32Array(bufferL.length);
      }
      bufferL.fill(0);
      for (const voice of voices) {
        workBuffer.fill(0);
        voice.processSamples(workBuffer);
        writeBuffer(bufferL, workBuffer);
      }
      applyBufferGainRms(bufferL, voices.length);
      applyBufferSoftClip(bufferL);
      copyBuffer(bufferR, bufferL);
    },
  };
}
