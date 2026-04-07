#pragma once
#include "./api.h"
#include "parameter-id.h"
#include <cmath>
// #include <cstdio>

enum class OscWave : int {
  Saw = 0,
  Rect,
  Tri,
  Sine,
  // Noise
};

enum class FilterType : int { LPF = 0, BPF, HPF };

enum class LfoWave : int { Sine = 0, Tri, Rect, Saw };

enum class LfoDestination : int {
  None = 0,
  Osc1Pitch,
  Osc1PWMix,
  Osc1Volume,
  Osc2Pitch,
  Osc2PWMix,
  Osc2Volume,
  FilterCutoff,
  AmpVolume,
};

inline float getFormulaicOscWave(OscWave wave, float phase) {
  if (wave == OscWave::Sine) {
    return std::sin(phase * 2.0f * M_PI);
  } else if (wave == OscWave::Saw) {
    return (2.0f * phase - 1.0f);
  } else if (wave == OscWave::Rect) {
    return (phase < 0.5f ? 1.0f : -1.0f);
  } else if (wave == OscWave::Tri) {
    return (phase < 0.5f ? (4.0f * phase - 1.0f) : (-4.0f * phase + 3.0f));
  }
  return 0.0f;
}

template <typename EnumType> inline EnumType paramToEnum(float value) {
  return static_cast<EnumType>(static_cast<int>(std::lround(value)));
}

inline bool paramToBool(float value) { return (value >= 0.5f); }

inline double MIDINoteToFrequency(int note) {
  constexpr auto kMiddleA = 440.0;
  return (kMiddleA / 32.0) * std::pow(2, ((note - 9) / 12.0));
}

typedef struct {
  int parametersVersion;
  bool oscOn;
  OscWave osc1Wave;
  float osc1Octave;
  float osc1Volume;
} SynthesisParameters;

typedef ParameterId PK;

inline void applySynthesisParameter(SynthesisParameters &sp, uint64_t id,
                                    float value) {
  // printf("applySynthesisParameter %llu %f\n", id, value);
  if (id == PK::parametersVersion) {
    sp.parametersVersion = static_cast<int>(std::lround(value));
  } else if (id == PK::osc1On) {
    sp.oscOn = paramToBool(value);
  } else if (id == PK::osc1Wave) {
    sp.osc1Wave = paramToEnum<OscWave>(value);
  } else if (id == PK::osc1Octave) {
    sp.osc1Octave = value;
  } else if (id == PK::osc1Volume) {
    sp.osc1Volume = value;
  }
}

typedef struct _SynthesizerStateBus {
  SynthesisParameters synthesisParameters;
  int noteNumber = -1;
} SynthesizerStateBus;

class SynthesizerRoot : public IDspCore {
private:
  float mPhase = 0.0;
  SynthesizerStateBus bus;

public:
  void prepareProcessing(double sampleRate, uint32_t maxFrameLength) override {}

  void setParameter(uint64_t id, double value) override {
    applySynthesisParameter(bus.synthesisParameters, id, value);
  }

  void noteOn(int noteNumber, double velocity) override {
    bus.noteNumber = noteNumber;
  }
  void noteOff(int noteNumber) override {
    if (bus.noteNumber == noteNumber) {
      bus.noteNumber = -1;
    }
  }

  void processAudio(float *leftBuffer, float *rightBuffer,
                    uint32_t frames) override {
    auto sp = bus.synthesisParameters;
    auto noteNumber = bus.noteNumber;
    if (!sp.oscOn)
      return;

    if (noteNumber == -1)
      return;

    auto noteFreq = MIDINoteToFrequency(noteNumber);

    auto prWave = sp.osc1Wave;
    auto prPitch = sp.osc1Octave;
    auto prVolume = sp.osc1Volume;

    auto freqRatio = (1.0f + (prPitch * 2.0f - 1.0f) * 0.5f); // 0.5~1.5
    auto freq = noteFreq * freqRatio;
    auto delta = freq / 44100.0f;

    for (int i = 0; i < frames; ++i) {
      mPhase += delta;
      if (mPhase >= 1.0f)
        mPhase -= 1.0f;
      auto y = getFormulaicOscWave(prWave, mPhase) * prVolume * prVolume;
      leftBuffer[i] = y;
      rightBuffer[i] = y;
    }
  }
};
