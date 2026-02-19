import { mapInvExpCurve, riseInvCosine } from "./curves";
import { LfoWave } from "./defs";
import { clampValue, mapUnaryFrom, mapUnaryTo, power2 } from "./number_utils";

export function calculateShortAttackEgLevel(gateOnUptime: number): number {
  // noteOn直後のクリック抑制用の短いアタック（0→1）
  const timeMaxMs = 2;
  const timeMaxSec = timeMaxMs / 1000;
  if (gateOnUptime < timeMaxSec) {
    const t = clampValue(gateOnUptime / timeMaxSec, 0, 1);
    return riseInvCosine(t);
  }
  return 1;
}

function mapEgSegmentCurve(u: number, v0: number, v1: number, c: number) {
  const scaler = 1 + power2(c) * 32;
  return mapUnaryTo(mapInvExpCurve(u, scaler), v0, v1);
}

export function getEnvelopeLevelADSR(
  t: number,
  egParams: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  },
  egConfig: {
    attackMaxSec: number;
    decayMaxSec: number;
    releaseMaxSec: number;
  },
  mode: "gateOn" | "gateOff",
  levelAtGateOff: number,
) {
  const attack = power2(egParams.attack) * egConfig.attackMaxSec;
  const decay = power2(egParams.decay) * egConfig.decayMaxSec;
  const sustain = egParams.sustain;
  const release = power2(egParams.release) * egConfig.releaseMaxSec;
  const curveParam = 0.5;

  if (mode === "gateOn") {
    if (t < attack) {
      const u = t / attack;
      return mapEgSegmentCurve(u, 0, 1, curveParam);
    } else if (t < attack + decay) {
      const u = mapUnaryFrom(t, attack, attack + decay);
      return mapEgSegmentCurve(u, 1, sustain, curveParam);
    } else {
      return sustain;
    }
  } else {
    if (t < release) {
      const u = t / release;
      return mapEgSegmentCurve(u, levelAtGateOff, 0, curveParam);
    }
  }
  return 0;
}

export function getLfoWaveform(wave: LfoWave, phase: number) {
  if (wave === LfoWave.Sine) {
    return Math.sin(phase * Math.PI * 2);
  } else if (wave === LfoWave.Tri) {
    return phase < 0.5 ? 2 * phase - 1 : 2 * (1 - phase) - 1;
  } else if (wave === LfoWave.Rect) {
    return phase < 0.5 ? 1 : -1;
  } else if (wave === LfoWave.Saw) {
    return (1 - phase) * 2 - 1;
  }
  return 0;
}
