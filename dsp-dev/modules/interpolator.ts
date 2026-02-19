export type Interpolator = {
  feed(nextValue: number, n: number): void;
  advance(): number;
  reset(): void;
};

export function createInterpolator() {
  let value: number | null;
  let delta = 0;

  return {
    feed(nextValue: number, n: number) {
      if (value === null) {
        value = nextValue;
      }
      delta = (nextValue - value) / n;
    },
    advance() {
      if (value === null) {
        throw new Error("interpolator.advance: value is null");
      }
      const res = value;
      value += delta;
      return res;
    },
    reset() {
      value = null;
    },
  };
}
