import { DSPCore } from "./definitions/dsp_core_interface";
import { assignParameter } from "./definitions/parameter_assigner";
import { calculateParameterIdentifierHash } from "./definitions/parameter_keys";
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
  const chunkSize = 32;
  const chunkBuffer = new Float32Array(chunkSize);
  const voiceBuffer = new Float32Array(chunkSize);

  function processFillChunk() {
    const buffer = chunkBuffer;
    buffer.fill(0);
    for (const voice of voices) {
      voiceBuffer.fill(0);
      voice.processSamples(voiceBuffer);
      writeBuffer(buffer, voiceBuffer);
    }
    applyBufferGainRms(buffer, voices.length);
    applyBufferSoftClip(buffer);
  }

  let readPos = 0;
  function processWithChunking(destBuffer: Float32Array, len: number) {
    if (len === 0) return;
    // 常に固定チャンクサイズ単位で波形生成を行う
    // モジュレーションの状態更新もチャンク境界でのみ行う,チャンク内では線形補完
    // sampleOffsetを指定した厳密なタイミングでの発音は現在未対応
    const outBuf = chunkBuffer;
    for (let i = 0; i < len; i++) {
      //読み出し位置が先頭にあるときバッファ1面分の波形を生成
      if (readPos === 0) {
        processFillChunk();
      }
      //1サンプルずつとって出力バッファを埋める
      destBuffer[i] = outBuf[readPos++];
      if (readPos >= outBuf.length) {
        readPos = 0;
      }
    }
  }

  return {
    setParametersVersion(_version) {},
    mapParameterKey(identifier) {
      return calculateParameterIdentifierHash(identifier);
    },
    setParameter(paramKey, value) {
      assignParameter(synthParameters, paramKey, value);
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
    process(bufferL, bufferR, len) {
      processWithChunking(bufferL, len);
      copyBuffer(bufferR, bufferL);
    },
  };
}

export function createDSPCoreInstance(): DSPCore {
  return createSynthesizerRoot();
}
