export function createFilterOnePoleHighPass(
  sampleRate: number,
  cutoffFreqInHz: number,
) {
  const a1 = Math.exp((-2.0 * Math.PI * cutoffFreqInHz) / sampleRate);
  const b0 = 0.5 * (1 + a1);
  const b1 = -0.5 * (1 + a1);
  let x1 = 0;
  let y1 = 0;

  function apply(x: number) {
    const tiny = 1e-32;
    y1 = b0 * x + b1 * x1 + a1 * y1 + tiny;
    x1 = x;
    return y1;
  }

  return { apply };
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
