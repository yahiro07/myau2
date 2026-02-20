export function createFilterOnePoleHighPass(cutoffFreqInHz: number) {
  let sampleRate = 0;
  let a1 = 0;
  let b0 = 0;
  let b1 = 0;
  let x1 = 0;
  let y1 = 0;

  function updateCoefficients() {
    a1 = Math.exp((-2.0 * Math.PI * cutoffFreqInHz) / sampleRate);
    b0 = 0.5 * (1 + a1);
    b1 = -0.5 * (1 + a1);
  }

  function setSampleRate(_sampleRate: number) {
    sampleRate = _sampleRate;
    updateCoefficients();
  }

  function apply(x: number) {
    if (sampleRate === 0) return x;
    const tiny = 1e-32;
    y1 = b0 * x + b1 * x1 + a1 * y1 + tiny;
    x1 = x;
    return y1;
  }

  return { setSampleRate, apply };
}

export function createFilterOnePoleHighPassDynamic() {
  let x1 = 0;
  let y1 = 0;
  return {
    apply(x: number, cutoffNormFreq: number) {
      const a1 = Math.exp(-2.0 * Math.PI * cutoffNormFreq);
      const b0 = 0.5 * (1 + a1);
      const b1 = -0.5 * (1 + a1);
      const tiny = 1e-32;
      y1 = b0 * x + b1 * x1 + a1 * y1 + tiny;
      x1 = x;
      return y1;
    },
  };
}
