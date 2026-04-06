export function clampValue(val: number, lo: number, hi: number) {
  if (val > hi) return hi;
  if (val < lo) return lo;
  return val;
}

export function clampValue01(val: number) {
  return clampValue(val, 0, 1);
}

export function mapUnaryTo(val: number, d0: number, d1: number) {
  return val * (d1 - d0) + d0;
}

export function mapUnaryToInt(val: number, v1: number, v2: number) {
  return v1 + Math.round(val * (v2 - v1));
}

export function mapUnaryFrom(
  val: number,
  lo: number,
  hi: number,
  clamp?: boolean,
) {
  if (hi === lo) return lo;
  const v = (val - lo) / (hi - lo);
  if (clamp) {
    return clampValue(v, 0, 1);
  }
  return v;
}

export function linearInterpolate(
  val: number,
  s0: number,
  s1: number,
  d0: number,
  d1: number,
  applyClamp?: boolean,
) {
  const res = ((val - s0) / (s1 - s0)) * (d1 - d0) + d0;
  if (applyClamp) {
    const lo = Math.min(d0, d1);
    const hi = Math.max(d0, d1);
    return clampValue(res, lo, hi);
  }
  return res;
}

export function mixValue(a: number, b: number, m: number) {
  return (1 - m) * a + m * b;
}

export function power2(x: number) {
  return x * x;
}

export function invPower2(x: number) {
  return 1 - (1 - x) * (1 - x);
}

export function power3(x: number) {
  return x * x * x;
}

export function invPower3(x: number) {
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

//x:-1__1, k:-1__1, positive k for low curve, negative k for high curve
export function tunableSigmoid(x: number, k: number) {
  return (x - k * x) / (k - 2 * k * Math.abs(x) + 1);
}

export function randF() {
  return Math.random();
}
