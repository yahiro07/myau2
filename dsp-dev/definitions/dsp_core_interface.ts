export type DSPCore = {
  setParametersVersion(version: number): void;
  setParameter(address: number, value: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  process(bufferL: Float32Array, bufferR: Float32Array, len: number): void;
};
