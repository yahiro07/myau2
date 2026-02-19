export type SynthesisInputMessage =
  | { type: "setParameter"; address: number; value: number }
  | { type: "noteOn"; noteNumber: number; velocity: number }
  | { type: "noteOff"; noteNumber: number };

export type SynthesizerRoot = {
  setParameter(address: number, value: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
};
