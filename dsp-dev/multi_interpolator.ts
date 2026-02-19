export type MultiInterpolator<T extends Record<string, number>> = {
  feedNext(newValues: T, n: number): void;
  advance(): T;
  reset(): void;
};

export function createMultiInterpolator<
  T extends Record<string, number>,
>(): MultiInterpolator<T> {
  type NumMap = { [K in keyof T]: number };
  let values: NumMap | null;
  const deltas: NumMap = {} as NumMap;

  return {
    feedNext(nextValues: T, n: number) {
      if (!values) {
        values = nextValues;
      }
      for (const key in values) {
        deltas[key] = (nextValues[key] - values[key]) / n;
      }
    },
    advance() {
      const res = { ...values } as T;
      for (const key in values) {
        values[key] += deltas[key];
      }
      return res;
    },
    reset() {
      values = null;
    },
  };
}
