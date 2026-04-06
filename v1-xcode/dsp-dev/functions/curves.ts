export function mapExpCurve(x: number, scaler: number = 4) {
  return (2 ** (x * scaler) - 1) / (2 ** scaler - 1);
}

export function mapInvExpCurve(x: number, scaler: number = 4) {
  return 1 - mapExpCurve(1 - x, scaler);
}

export function riseInvCosine(x: number) {
  return 0.5 - 0.5 * Math.cos(x * Math.PI);
}
