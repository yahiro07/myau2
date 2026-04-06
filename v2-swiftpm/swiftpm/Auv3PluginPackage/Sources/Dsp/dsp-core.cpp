#include "dsp-core.h"
#include <cmath>
#include <cstdlib>

enum class ParameterId {
  parametersVersion = 0,
  oscEnabled,
  oscWave,
  oscPitch,
  oscVolume,
};

enum class OscWave { Saw = 0, Square, Sine, Noise };

struct ParametersSuit {
  bool oscEnabled;
  OscWave oscWave;
  float oscPitch;
  float oscVolume;
};

class DspCore : public IDspCore {
private:
  double sampleRate = 0.0;
  int noteNumber = 60;
  bool gateOn = false;
  ParametersSuit parameters;
  float phase = 0.0;

public:
  void prepareProcessing(double sampleRate, uint32_t maxFrames) override {
    this->sampleRate = sampleRate;
  }
  void setParameter(uint32_t id, double value) override {
    if (id == (uint32_t)ParameterId::oscEnabled) {
      this->parameters.oscEnabled = value > 0.5;
    } else if (id == (uint32_t)ParameterId::oscWave) {
      this->parameters.oscWave = (OscWave)value;
    } else if (id == (uint32_t)ParameterId::oscPitch) {
      this->parameters.oscPitch = value;
    } else if (id == (uint32_t)ParameterId::oscVolume) {
      this->parameters.oscVolume = value;
    }
  }
  void noteOn(int noteNumber, double velocity) override {
    this->noteNumber = noteNumber;
    this->gateOn = true;
  }
  void noteOff(int noteNumber) override {
    if (noteNumber == this->noteNumber) {
      this->gateOn = false;
    }
  }
  void processAudio(float *bufferL, float *bufferR, uint32_t frames) override {
    if (0) {
      for (uint32_t i = 0; i < frames; i++) {
        auto y = (rand() / (float)RAND_MAX * 2.0 - 1.0) * 0.1;
        bufferL[i] = y;
        bufferR[i] = y;
      }
      return;
    }
    if (this->sampleRate == 0.0)
      return;

    const double noteNumber =
        this->noteNumber + this->parameters.oscPitch * 24 - 12;
    const double freq = 440 * powf(2, (noteNumber - 69) / 12);
    const double phaseInc = freq / this->sampleRate;
    const float gain = this->gateOn && this->parameters.oscEnabled
                           ? this->parameters.oscVolume
                           : 0;

    for (uint32_t i = 0; i < frames; i++) {
      this->phase += phaseInc;
      this->phase -= std::floor(this->phase);
      float y = 0;
      if (this->parameters.oscWave == OscWave::Saw) {
        y = 1 - this->phase;
      } else if (this->parameters.oscWave == OscWave::Square) {
        y = this->phase < 0.5 ? 1 : -1;
      } else if (this->parameters.oscWave == OscWave::Sine) {
        y = std::sin(2 * M_PI * this->phase);
      } else if (this->parameters.oscWave == OscWave::Noise) {
        y = (rand() / (float)RAND_MAX * 2.0 - 1.0);
      }
      y *= gain;
      bufferL[i] = y;
      bufferR[i] = y;
    }
  }
};

IDspCore *createDspCore() { return new DspCore(); }