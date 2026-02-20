export type DSPCore = {
  setParametersVersion(version: number): void;
  // mapParameterKey(address: number, identifier: string): number;
  mapParameterCode(identifier: string): number;
  setParameter(code: number, value: number): void;

  prepare(sampleRate: number, maxFrameLength: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  process(bufferL: Float32Array, bufferR: Float32Array, frames: number): void;
};
