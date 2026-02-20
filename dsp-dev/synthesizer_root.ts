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
  processSamples(buffer: Float32Array, len: number): void;
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

  const chunkSize = 32;
  const chunkBuffer = new Float32Array(chunkSize);

  function processFillChunk() {
    if (!voiceState.sampleRate) return;
    const buffer = chunkBuffer;
    buffer.fill(0);
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
  }

  let chunkReadPos = 0;
  function processWithChunking(destBuffer: Float32Array, len: number) {
    if (len === 0) return;
    // 固定チャンクサイズ単位で波形生成を行う
    // モジュレーションの状態更新をチャンク境界で行う,チャンク内では線形補完
    const outBuf = chunkBuffer;
    for (let i = 0; i < len; i++) {
      //読み出し位置が先頭にあるときバッファ1面分の波形を生成
      if (chunkReadPos === 0) {
        processFillChunk();
      }
      //1サンプルずつとって出力バッファを埋める
      destBuffer[i] = outBuf[chunkReadPos++];
      if (chunkReadPos >= outBuf.length) {
        chunkReadPos = 0;
      }
    }
  }

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
      chunkReadPos = 0;
      //発音開始位置にチャンクの先頭を合わせるためボイス波形の先頭は発音開始位置に揃う
    },
    noteOff() {
      voiceState.gateOn = false;
      voiceState.gateOffUptime = 0;
      //固定チャンク処理のためノートオフでの波形への反映が最大でチャンク幅分遅れる場合がある
      //(Fs=48kHz, チャンク幅=32サンプルのとき最大約0.67msの遅延)
    },
    processSamples(buffer: Float32Array, len: number) {
      processWithChunking(buffer, len);
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

  let sampleRate: number | undefined;
  let workBuffer: Float32Array | undefined;

  return {
    setParametersVersion(_version) {},
    mapParameterKey(identifier) {
      return calculateParameterIdentifierHash(identifier);
    },
    setParameter(paramKey, value) {
      assignParameter(synthParameters, paramKey, value);
    },
    prepare(_sampleRate, maxFrameLength) {
      sampleRate = _sampleRate;
      if (!workBuffer || workBuffer.length < maxFrameLength) {
        workBuffer = new Float32Array(maxFrameLength);
      }
      for (const voice of voices) {
        voice.prepare(_sampleRate);
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
      if (!sampleRate || !workBuffer || workBuffer.length < len) return;
      const buffer = bufferL;
      buffer.fill(0);
      for (const voice of voices) {
        workBuffer.fill(0);
        voice.processSamples(workBuffer, len);
        writeBuffer(buffer, workBuffer);
      }
      applyBufferGainRms(buffer, voices.length);
      applyBufferSoftClip(buffer);

      copyBuffer(bufferR, bufferL);
    },
  };
}

export function createDSPCoreInstance(): DSPCore {
  return createSynthesizerRoot();
}
