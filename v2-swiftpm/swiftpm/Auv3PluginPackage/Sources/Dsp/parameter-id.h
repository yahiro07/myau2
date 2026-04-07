#pragma once
#include <cstdint>

constexpr uint64_t hash(const char *str) {
  uint64_t _hash = 0x811c9dc5;
  for (int i = 0; str[i] != '\0'; i++) {
    _hash ^= str[i];
    _hash = _hash * 0x01000193;
  }
  return _hash;
}

enum ParameterId : uint64_t {
  parametersVersion = hash("parametersVersion"),
  //
  osc1On = hash("osc1On"),
  osc1Wave = hash("osc1Wave"),
  osc1Octave = hash("osc1Octave"),
  osc1PwMix = hash("osc1PwMix"),
  osc1Volume = hash("osc1Volume"),
  //
  osc2On = hash("osc2On"),
  osc2Wave = hash("osc2Wave"),
  osc2Octave = hash("osc2Octave"),
  osc2Detune = hash("osc2Detune"),
  osc2Volume = hash("osc2Volume"),
  //
  filterOn = hash("filterOn"),
  filterType = hash("filterType"),
  filterCutoff = hash("filterCutoff"),
  filterPeak = hash("filterPeak"),
  filterEnvMod = hash("filterEnvMod"),
  //
  ampOn = hash("ampOn"),
  ampAttack = hash("ampAttack"),
  ampDecay = hash("ampDecay"),
  ampSustain = hash("ampSustain"),
  ampRelease = hash("ampRelease"),
  //
  lfoOn = hash("lfoOn"),
  lfoWave = hash("lfoWave"),
  lfoRate = hash("lfoRate"),
  lfoDepth = hash("lfoDepth"),
  lfoTarget = hash("lfoTarget"),
  //
  egOn = hash("egOn"),
  egAttack = hash("egAttack"),
  egDecay = hash("egDecay"),
  egAmount = hash("egAmount"),
  egTarget = hash("egTarget"),
  //
  glide = hash("glide"),
  voicingMode = hash("voicingMode"),
  masterVolume = hash("masterVolume"),
};
