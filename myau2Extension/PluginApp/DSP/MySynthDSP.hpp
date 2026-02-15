#include "DSPCore.hpp"
#include "ParameterAddresses.h"

#include <cmath>

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

typedef ParameterAddress Addrs;

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
  bool oscOn;
  OscWave osc1Wave;
  float osc1Octave;
  float osc1Volume;
} SynthesisParameters;

inline void applySynthesisParameter(SynthesisParameters &sp, int address,
                                    float value) {
  switch (address) {
  case Addrs::osc1On:
    sp.oscOn = paramToBool(value);
    break;
  case Addrs::osc1Wave:
    sp.osc1Wave = paramToEnum<OscWave>(value);
    break;
  case Addrs::osc1Octave:
    sp.osc1Octave = value;
    break;
  case Addrs::osc1Volume:
    sp.osc1Volume = value;
    break;
  default:
    break;
  }
}

typedef struct _SynthesizerStateBus {
  SynthesisParameters synthesisParameters;
  int noteNumber = -1;
} SynthesizerStateBus;

class MySynthDSP : public DSPCore {
private:
  float mPhase = 0.0;
  SynthesizerStateBus bus;

public:
  void setParameter(int address, float value) override {
    applySynthesisParameter(bus.synthesisParameters, address, value);
  }

  void noteOn(int noteNumber, float velocity) override {
    bus.noteNumber = noteNumber;
  }
  void noteOff(int noteNumber) override {
    if (bus.noteNumber == noteNumber) {
      bus.noteNumber = -1;
    }
  }

  void process(float *leftBuffer, float *rightBuffer, int frames) override {
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
