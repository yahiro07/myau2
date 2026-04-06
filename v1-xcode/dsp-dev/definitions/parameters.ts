export enum OscWave {
  Saw = 0,
  Rect,
  Tri,
  Sine,
  Noise,
}
export enum LfoWave {
  Sine = 0,
  Tri,
  Rect,
  Saw,
  SampleHold,
}

export enum FilterType {
  LPF = 0,
  BPF,
  HPF,
}

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

export enum VoicingMode {
  Poly = 0,
  Mono,
}

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
