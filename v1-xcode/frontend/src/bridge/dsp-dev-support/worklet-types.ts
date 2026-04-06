export type SynthesisInputMessage =
  | { type: "setParameter"; identifier: string; value: number }
  | { type: "noteOn"; noteNumber: number; velocity: number }
  | { type: "noteOff"; noteNumber: number };

export type SynthesizerRoot = {
  setParameter(identifier: string, value: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
};
