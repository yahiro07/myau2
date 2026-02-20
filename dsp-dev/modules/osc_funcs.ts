import { OscWave } from "../definitions/parameters";
import {
  invPower2,
  linearInterpolate,
  mixValue,
  randF,
  tunableSigmoid,
} from "../functions/number_utils";

export function midiToFrequency(midiNote: number): number {
  return 440 * 2 ** ((midiNote - 69) / 12);
}

function polyblep(t: number, dt: number): number {
  if (t < dt) {
    const tNorm = t / dt;
    return -tNorm * tNorm + 2 * tNorm - 1.0;
  } else if (t > 1.0 - dt) {
    const tNorm = (t - 1.0) / dt;
    return tNorm * tNorm + 2 * tNorm + 1.0;
  }
  return 0.0;
}

function polyblepAt(t: number, dt: number, offset: number): number {
  let tShifted = t - offset;
  tShifted -= Math.floor(tShifted);
  return polyblep(tShifted, dt);
}

export function getOscCoreWaveform(
  wave: OscWave,
  phase: number,
  phaseInc: number,
  pw: number,
): number {
  if (wave === OscWave.Saw) {
    if (0) {
      let y = 2 * phase - 1;
      y -= polyblep(phase, phaseInc);
      return y;
    } else if (1) {
      const bp = invPower2(pw) * 0.95;
      let y = 0;
      if (phase < bp) {
        y = -1;
      } else {
        y = linearInterpolate(phase, bp, 1, -1, 1);
      }
      y -= polyblep(phase, phaseInc);
      return y;
    } else if (0) {
      const d = pw * 0.45;
      const bp1 = 0.5 - d;
      const bp2 = 0.5 + d;
      let y = 0;
      if (phase < bp1) {
        y = linearInterpolate(phase, 0, bp1, -1, 0);
      } else if (phase < bp2) {
        y = 0;
      } else {
        y = linearInterpolate(phase, bp2, 1, 0, 1);
      }
      y -= polyblep(phase, phaseInc);
      return y;
    }
  } else if (wave === OscWave.Rect) {
    const bp = 0.5 - pw * 0.4;
    let y = phase < bp ? 1.0 : -1.0;
    y += polyblepAt(phase, phaseInc, 0);
    y -= polyblepAt(phase, phaseInc, bp);
    return y;
  } else if (wave === OscWave.Tri) {
    const y = 4 * Math.abs(phase - 0.5) - 1.0;
    return tunableSigmoid(y, pw * 0.9);
  } else if (wave === OscWave.Sine) {
    const y = Math.sin(2 * Math.PI * phase);
    return tunableSigmoid(y, pw * 0.9);
  } else if (wave === OscWave.Noise) {
    return randF() * 2 - 1;
  }
  return 0;
}

export function mixPitchedNoise(sampleHoldValue: number, pw: number) {
  const noise = Math.random();
  return mixValue(noise, sampleHoldValue, pw) * 2 - 1;
}
