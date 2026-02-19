import { LfoWave, ModTarget, OscWave } from "./definitions/parameters";
import { VoiceState } from "./definitions/state_bus";
import {
  clampValue,
  invPower2,
  mapUnaryTo,
  mapUnaryToInt,
  power2,
} from "./functions/number_utils";
import { createFilterBiquadLp12 } from "./modules/filter_biquad_lp12";
import { createInterpolator } from "./modules/interpolator";
import {
  applyUnitParameterModulated,
  getOscModRelNote,
} from "./modules/modulation_affecter";
import {
  calculateShortAttackEgLevel,
  getEnvelopeLevelADSR,
  getLfoWaveform,
} from "./modules/modulation_funcs";
import {
  getOscCoreWaveform,
  midiToFrequency,
  mixPitchedNoise,
} from "./modules/osc_funcs";

export function createOscillator(
  voiceState: VoiceState,
  oscId: "osc1" | "osc2",
) {
  let phaseAcc = 0;
  let sampleHoldValue = 0;
  const sp = voiceState.synthParameters;

  function getOscParameters() {
    const isOn = oscId === "osc1" ? sp.osc1On : sp.osc2On;
    const wave = oscId === "osc1" ? sp.osc1Wave : sp.osc2Wave;
    const prOctave = oscId === "osc1" ? sp.osc1Octave : sp.osc2Octave;
    const prPwMix = oscId === "osc1" ? sp.osc1PwMix : 0.5;
    const prVolume = oscId === "osc1" ? sp.osc1Volume : sp.osc2Volume;
    const prDetune = oscId === "osc1" ? 0.5 : sp.osc2Detune;
    const modTargetKey_pitch =
      oscId === "osc1" ? ModTarget.Osc1Pitch : ModTarget.Osc2Pitch;
    const modTargetKey_pwMix =
      oscId === "osc1" ? ModTarget.Osc1PwMix : undefined;
    const modTargetKey_volume =
      oscId === "osc1" ? ModTarget.Osc1Volume : ModTarget.Osc2Volume;
    return {
      isOn,
      wave,
      prOctave,
      prPwMix,
      prVolume,
      prDetune,
      modTargetKey_pitch,
      modTargetKey_pwMix,
      modTargetKey_volume,
    };
  }
  const miPwMix = createInterpolator();
  return {
    reset() {
      phaseAcc = 0;
      miPwMix.reset();
    },
    process(buffer: Float32Array) {
      const {
        isOn,
        wave,
        prOctave,
        prPwMix: prPwMixOriginal,
        prVolume: prVolumeOriginal,
        prDetune,
        modTargetKey_pitch,
        modTargetKey_pwMix,
        modTargetKey_volume,
      } = getOscParameters();
      if (!isOn) return;

      const modRelNote = getOscModRelNote(voiceState, modTargetKey_pitch);

      const prPwMix = applyUnitParameterModulated(
        voiceState,
        prPwMixOriginal,
        modTargetKey_pwMix,
      );
      const prVolume = applyUnitParameterModulated(
        voiceState,
        prVolumeOriginal,
        modTargetKey_volume,
      );

      const octave = mapUnaryToInt(prOctave, -2, 2);
      const freq = midiToFrequency(
        voiceState.noteNumber +
          octave * 12 +
          power2(prDetune) * 1.0 +
          modRelNote,
      );
      const phaseInc = freq / voiceState.sampleRate;

      miPwMix.feed(prPwMix, buffer.length);

      for (let i = 0; i < buffer.length; i++) {
        phaseAcc = phaseAcc + phaseInc;
        if (phaseAcc >= 1.0) {
          phaseAcc -= 1.0;
          sampleHoldValue = Math.random();
        }
        const pwMix = miPwMix.advance();

        let y = 0;
        if (0) {
          y =
            wave === OscWave.Noise
              ? mixPitchedNoise(sampleHoldValue, pwMix)
              : getOscCoreWaveform(wave, phaseAcc, phaseInc, pwMix);
        } else {
          y = getOscCoreWaveform(wave, phaseAcc, phaseInc, pwMix);
        }
        buffer[i] += y * prVolume;
      }
    },
  };
}

export function createFilter(voiceState: VoiceState) {
  const filterBiquadLp12 = createFilterBiquadLp12(voiceState.sampleRate);

  function calculateNormalizedCutoffFreq(
    noteNumber: number,
    prCutoff: number,
    sampleRate: number,
  ) {
    const bottomNoteNumber = noteNumber - 6;
    const topNoteNumber = 124;
    const cutoffNotePitch = mapUnaryTo(
      invPower2(prCutoff),
      bottomNoteNumber,
      topNoteNumber,
    );
    const cutoffNormFreq = midiToFrequency(cutoffNotePitch) / sampleRate;
    return clampValue(cutoffNormFreq, 0.0, 0.49);
  }

  return {
    reset() {
      filterBiquadLp12.reset();
    },
    processSamples(buffer: Float32Array) {
      const sp = voiceState.synthParameters;
      if (!sp.filterOn) return;
      // const prCutoff = highClip(sp.filterCutoff + interm.filterMod * 0.5, 1);
      const prCutoff = sp.filterCutoff;
      const cutoffNormFreq = calculateNormalizedCutoffFreq(
        voiceState.noteNumber,
        prCutoff,
        voiceState.sampleRate,
      );
      const prPeak = sp.filterPeak;
      filterBiquadLp12.processSamples(buffer, cutoffNormFreq, prCutoff, prPeak);
    },
  };
}

export function createAmpEg(voiceState: VoiceState) {
  const ampEgConfig = {
    attackMaxSec: 3,
    decayMaxSec: 3,
    releaseMaxSec: 3,
  };
  let gateOnLatestLevel = 0;

  function getAmpEgLevel() {
    const sp = voiceState.synthParameters;
    if (!sp.ampOn) {
      return voiceState.gateOn ? 1 : 0;
    }
    const egParams = {
      attack: sp.ampAttack,
      decay: sp.ampDecay,
      sustain: sp.ampSustain,
      release: sp.ampRelease,
    };
    if (voiceState.gateOn) {
      return getEnvelopeLevelADSR(
        voiceState.gateOnUptime,
        egParams,
        ampEgConfig,
        "gateOn",
        0,
      );
    } else {
      return getEnvelopeLevelADSR(
        voiceState.gateOffUptime,
        egParams,
        ampEgConfig,
        "gateOff",
        gateOnLatestLevel,
      );
    }
  }

  function getClickSuppressingGain() {
    if (voiceState.gateOn) {
      return calculateShortAttackEgLevel(voiceState.gateOnUptime);
    } else {
      return 1;
    }
  }

  return {
    advance() {
      const egLevel = getAmpEgLevel();
      voiceState.intermediate.ampEgLevel = egLevel;
      if (voiceState.gateOn) {
        gateOnLatestLevel = egLevel;
      }
      voiceState.intermediate.clickSuppressingGain = getClickSuppressingGain();
    },
  };
}

export function createVoicingAmp(voiceState: VoiceState) {
  return {
    process(buffer: Float32Array) {
      const { ampEgLevel, clickSuppressingGain } = voiceState.intermediate;
      const gain = ampEgLevel * clickSuppressingGain;
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = buffer[i] * gain;
      }
    },
  };
}

export function createModEg(voiceState: VoiceState) {
  const ampEgConfig = {
    attackMaxSec: 3,
    decayMaxSec: 3,
    releaseMaxSec: 3,
  };
  let gateOnLatestLevel = 0;

  function getModEgLevel() {
    const sp = voiceState.synthParameters;
    if (!sp.ampOn) {
      return voiceState.gateOn ? 1 : 0;
    }
    const egParams = {
      attack: sp.egAttack,
      decay: sp.egDecay,
      sustain: 0,
      release: sp.egDecay,
    };
    if (voiceState.gateOn) {
      return getEnvelopeLevelADSR(
        voiceState.gateOnUptime,
        egParams,
        ampEgConfig,
        "gateOn",
        0,
      );
    } else {
      return getEnvelopeLevelADSR(
        voiceState.gateOffUptime,
        egParams,
        ampEgConfig,
        "gateOff",
        gateOnLatestLevel,
      );
    }
  }

  return {
    advance() {
      const egLevel = getModEgLevel();
      voiceState.intermediate.modEgLevel = egLevel;
      if (voiceState.gateOn) {
        gateOnLatestLevel = egLevel;
      }
    },
  };
}

export function createLfo(voiceState: VoiceState) {
  let phaseAcc = 0;
  let sampleHoldValue = 0;
  return {
    reset() {
      phaseAcc = 0;
    },
    advance(len: number) {
      const sp = voiceState.synthParameters;
      const freq = mapUnaryTo(sp.lfoRate, 0.01, 10);
      const delta = freq / voiceState.sampleRate;
      phaseAcc += delta * len;
      if (phaseAcc >= 1) {
        sampleHoldValue = Math.random() * 2 - 1;
        phaseAcc -= 1;
      }
      const y =
        sp.lfoWave === LfoWave.SampleHold
          ? sampleHoldValue
          : getLfoWaveform(sp.lfoWave, phaseAcc);
      voiceState.intermediate.lfoOutputValue = y;
    },
  };
}
