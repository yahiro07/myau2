import { SynthParametersSuit } from "./defs";

export type VoiceIntermediateState = {
  ampEgLevel: number;
  clickSuppressingGain: number;
  modEgLevel: number;
  lfoOutputValue: number;
  osc1ModRelNote: number;
  osc2ModRelNote: number;
};

export type VoiceState = {
  synthParameters: SynthParametersSuit;
  intermediate: VoiceIntermediateState;
  sampleRate: number;
  noteNumber: number;
  gateOn: boolean;
  gateOnUptime: number; //seconds
  gateOffUptime: number; //seconds
  randomSeed: number;
};

export function createVoiceState(
  synthParameters: SynthParametersSuit,
  sampleRate: number,
): VoiceState {
  return {
    synthParameters,
    intermediate: {
      ampEgLevel: 0,
      clickSuppressingGain: 0,
      modEgLevel: 0,
      lfoOutputValue: 0,
      osc1ModRelNote: 0,
      osc2ModRelNote: 0,
    },
    sampleRate,
    noteNumber: 60,
    gateOn: false,
    gateOnUptime: 0,
    gateOffUptime: 0,
    randomSeed: 0,
  };
}
