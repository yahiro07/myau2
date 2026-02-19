import { clampValue } from "./number_utils";

export function softClip(x: number) {
  const sqrt2 = Math.SQRT2;
  x = clampValue(x, -sqrt2, sqrt2);
  return x - (x * x * x) / 6.0;
}

export function applySoftClipAt(x: number, a: number) {
  return softClip(x / a) * a;
}

export function applyBufferSoftClip(buffer: Float32Array) {
  for (let i = 0; i < buffer.length; i++) {
    let x = buffer[i];
    const sqrt2 = Math.SQRT2;
    x = clampValue(x, -sqrt2, sqrt2);
    const y = x - (x * x * x) / 6.0;
    buffer[i] = y;
  }
}
