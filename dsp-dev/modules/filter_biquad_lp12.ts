// Biquad Lowpass Filter (12dB/oct, 2-pole)
// Standard cookbook implementation

import { applySoftClipAt } from "../functions/clippers";
import { clampValue } from "../functions/number_utils";
import { createFilterOnePoleHighPass } from "./filter_onepole_highpass";
import { createMultiInterpolator } from "./multi_interpolator";

export interface IFilter {
  reset(): void;
  setSampleRate(sampleRate: number): void;
  processSamples(
    buffer: Float32Array,
    cutoffNormFreq: number, // 0__0.5
    paramCutoff: number,
    paramPeak: number, // 0__1
  ): void;
}

export function createFilterBiquadLp12(): IFilter {
  // Biquad state variables (Direct Form II)
  let z1 = 0;
  let z2 = 0;

  // External feedback state (one-sample delay).
  // Used for TeeBee-style stabilization with HPF in the feedback path.
  let fbY = 0;

  type Coefficients = {
    b0: number;
    b1: number;
    b2: number;
    a1: number;
    a2: number;
  };

  const interpolator = createMultiInterpolator<{
    paramCutoff: number;
    paramPeak: number;
    b0: number;
    b1: number;
    b2: number;
    a1: number;
    a2: number;
  }>();

  // Feedback-path HPF to prevent DC / very-low-frequency buildup.
  const highPass = createFilterOnePoleHighPass(40);

  function calculateCoefficients(
    cutoffNormFreq: number,
    paramPeak: number,
  ): Coefficients {
    // Ensure cutoffNormFreq is in valid range
    const freq = clampValue(cutoffNormFreq, 0.0001, 0.49);

    // Map paramResonance (0-1) to Q (0.5-20)
    // Q = 0.5 means no resonance, higher Q means more resonance
    const minQ = 0.5;
    const maxQ = 20.0;
    const Q = minQ + paramPeak * (maxQ - minQ);

    // Cookbook formula for lowpass biquad
    const omega = 2.0 * Math.PI * freq;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2.0 * Q);

    const a0 = 1.0 + alpha;
    const a1 = -2.0 * cosOmega;
    const a2 = 1.0 - alpha;
    const b0 = (1.0 - cosOmega) / 2.0;
    const b1 = 1.0 - cosOmega;
    const b2 = (1.0 - cosOmega) / 2.0;

    // Normalize by a0
    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0,
    };
  }

  function processSamples(
    buffer: Float32Array,
    cutoffNormFreq: number,
    paramCutoff: number,
    paramPeak: number,
  ): void {
    paramPeak *= 0.4;

    const coeffs = calculateCoefficients(cutoffNormFreq, paramPeak);
    interpolator.feedNext({ paramCutoff, paramPeak, ...coeffs }, buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const {
        paramCutoff: prCutoff,
        paramPeak: prPeak,
        b0,
        b1,
        b2,
        a1,
        a2,
      } = interpolator.advance();

      // TeeBee-style external feedback with HPF (one-sample delay).
      // This is intentionally *outside* the cookbook biquad topology.
      const feedbackAmount = prPeak * (1 - prCutoff) * 0.9;

      const feedbackSignal = applySoftClipAt(fbY, 2);
      const feedbackFiltered = highPass.apply(feedbackSignal * feedbackAmount);

      // Direct Form II implementation
      const input = buffer[i] - feedbackFiltered;
      const w = input - a1 * z1 - a2 * z2;
      let y = b0 * w + b1 * z1 + b2 * z2;

      // Update state
      z2 = z1;
      z1 = w;

      //soft clip
      y = applySoftClipAt(y, 2);
      fbY = y;
      buffer[i] = y;
    }
  }

  function reset() {
    z1 = 0;
    z2 = 0;
    fbY = 0;
  }

  function setSampleRate(sampleRate: number) {
    highPass.setSampleRate(sampleRate);
  }

  return { setSampleRate, processSamples, reset };
}
