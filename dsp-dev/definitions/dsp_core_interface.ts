export type DSPCore = {
  setParametersVersion(version: number): void;
  // mapParameterKey(address: number, identifier: string): number;
  mapParameterKey(identifier: string): number;
  setParameter(paramKey: number, value: number): void;

  prepare(sampleRate: number, maxFrameLength: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  process(bufferL: Float32Array, bufferR: Float32Array, frames: number): void;
};
