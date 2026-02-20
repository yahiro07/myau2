export type DSPCore = {
  setParametersVersion(version: number): void;
  // TypeScriptでのプロトタイピングではパラメタのaddressが未知のため提供されない
  // 常にidentifierをハッシュ化する方式でパラメタを識別する実装とする
  // mapParameterCode(identifier: string, address: number): number; //本来のC++でのAPI
  mapParameterCode(identifier: string): number;
  setParameter(code: number, value: number): void;

  prepare(sampleRate: number, maxFrameLength: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  process(bufferL: Float32Array, bufferR: Float32Array, frames: number): void;
};
