export function seqNumbers(n: number): number[] {
  return new Array(n).fill(0).map((_, i) => i);
}
