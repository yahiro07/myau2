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

inline float MIDINoteToFrequency(int note) {
  return 440.0f * std::pow(2, ((note - 69) / 12.0));
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

struct SynthesizerStateBus {
  SynthesisParameters synthesisParameters;
  float sampleRate = 0.f;
  int noteNumber = 60;
  bool gateOn = false;
};

class SynthesizerRoot : public IDspCore {
private:
  float mPhase = 0.0;
  SynthesizerStateBus bus;

public:
  void prepareProcessing(double sampleRate, uint32_t maxFrameLength) override {
    // printf("⭐️sr 2144\n");
    bus.sampleRate = static_cast<float>(sampleRate);
  }

  void setParameter(uint64_t id, double value) override {
    applySynthesisParameter(bus.synthesisParameters, id, value);
  }

  void noteOn(int noteNumber, double velocity) override {
    bus.noteNumber = noteNumber;
    bus.gateOn = true;
  }
  void noteOff(int noteNumber) override {
    if (noteNumber == bus.noteNumber) {
      bus.gateOn = false;
    }
  }

  void processAudio(float *leftBuffer, float *rightBuffer,
                    uint32_t frames) override {
    if (bus.sampleRate == 0.f)
      return;
    auto sp = bus.synthesisParameters;
    auto ni = bus.noteNumber + ((sp.osc1Octave * 4) - 2) * 12;
    auto freq = MIDINoteToFrequency(ni);
    auto delta = freq / bus.sampleRate;
    auto prWave = sp.osc1Wave;
    auto gain = sp.oscOn && bus.gateOn ? sp.osc1Volume : 0.0f;

    for (int i = 0; i < frames; ++i) {
      mPhase += delta;
      if (mPhase >= 1.0f)
        mPhase -= 1.0f;
      auto y = getFormulaicOscWave(prWave, mPhase) * gain;
      leftBuffer[i] = y;
      rightBuffer[i] = y;
    }
  }
};
