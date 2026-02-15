import { createEnumOptions } from "@/common/selector-option";

export enum OscWave {
  Saw = 0,
  Rect,
  Tri,
  Sine,
  Noise,
}
export const oscWaveOptions = createEnumOptions<OscWave>([
  [OscWave.Saw, "Saw"],
  [OscWave.Rect, "Rect"],
  [OscWave.Tri, "Tri"],
  [OscWave.Sine, "Sine"],
  [OscWave.Noise, "Noise"],
]);
export enum LfoWave {
  Sine = 0,
  Tri,
  Rect,
  Saw,
  SampleHold,
}
export const lfoWaveOptions = createEnumOptions<LfoWave>([
  [LfoWave.Sine, "Sine"],
  [LfoWave.Rect, "Rect"],
  [LfoWave.Tri, "Tri"],
  [LfoWave.Saw, "Saw"],
  [LfoWave.SampleHold, "SH"],
]);
export enum FilterType {
  LPF = 0,
  BPF,
  HPF,
}
export const filterTypeOptions = createEnumOptions<FilterType>([
  [FilterType.LPF, "LPF"],
  [FilterType.BPF, "BPF"],
  [FilterType.HPF, "HPF"],
]);

export enum ModTarget {
  None = 0,
  Osc1Pitch,
  Osc1PwMix,
  Osc1Volume,
  Osc2Pitch,
  Osc2Volume,
  FilterCutoff,
  AmpVolume,
}
export const modTargetOptions = createEnumOptions<ModTarget>([
  [ModTarget.None, "None"],
  [ModTarget.Osc1Pitch, "Osc1 Pitch"],
  [ModTarget.Osc1PwMix, "Osc1 PW"],
  [ModTarget.Osc1Volume, "Osc1 Volume"],
  [ModTarget.Osc2Pitch, "Osc2 Pitch"],
  [ModTarget.Osc2Volume, "Osc2 Volume"],
  [ModTarget.FilterCutoff, "Filter Cutoff"],
  [ModTarget.AmpVolume, "Amp Volume"],
]);

export enum VoicingMode {
  Poly = 0,
  Mono,
}
export const VoicingModeOptions = createEnumOptions<VoicingMode>([
  [VoicingMode.Poly, "Poly"],
  [VoicingMode.Mono, "Mono"],
]);

export type SynthParametersSuit = {
  osc1On: boolean;
  osc1Wave: OscWave;
  osc1Octave: number;
  osc1PwMix: number;
  osc1Volume: number;
  //
  osc2On: boolean;
  osc2Wave: OscWave;
  osc2Octave: number;
  osc2Detune: number;
  osc2Volume: number;
  //
  filterOn: boolean;
  filterType: FilterType;
  filterCutoff: number;
  filterPeak: number;
  filterEnvMod: number;
  //
  ampOn: boolean;
  ampAttack: number;
  ampDecay: number;
  ampSustain: number;
  ampRelease: number;
  //
  lfoOn: boolean;
  lfoWave: LfoWave;
  lfoRate: number;
  lfoDepth: number;
  lfoTarget: ModTarget;
  //
  egOn: boolean;
  egAttack: number;
  egDecay: number;
  egAmount: number;
  egTarget: ModTarget;
  //
  glide: number;
  // mono: boolean;
  voicingMode: VoicingMode;
  masterVolume: number;
};

export const defaultSynthParameters: SynthParametersSuit = {
  osc1On: true,
  osc1Wave: OscWave.Saw,
  osc1Octave: 0.5,
  osc1PwMix: 0,
  osc1Volume: 1,
  //
  osc2On: false,
  osc2Wave: OscWave.Saw,
  osc2Octave: 0.5,
  osc2Detune: 0.5,
  osc2Volume: 1,
  //
  filterOn: true,
  filterType: FilterType.LPF,
  filterCutoff: 1,
  filterPeak: 0,
  filterEnvMod: 0,
  //
  ampOn: true,
  ampAttack: 0,
  ampDecay: 0,
  ampSustain: 1,
  ampRelease: 0,
  //
  lfoOn: false,
  lfoWave: LfoWave.Sine,
  lfoRate: 0.5,
  lfoDepth: 0.5,
  lfoTarget: ModTarget.Osc1Pitch,
  //
  egOn: false,
  egAttack: 0,
  egDecay: 0.5,
  egAmount: 0.5,
  egTarget: ModTarget.FilterCutoff,
  //
  glide: 0,
  voicingMode: VoicingMode.Poly,
  masterVolume: 0.5,
};

export type ParameterKey = keyof SynthParametersSuit;
