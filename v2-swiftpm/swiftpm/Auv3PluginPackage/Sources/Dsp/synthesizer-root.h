#pragma once
#include "./definitions/api.h"

class SynthesizerRoot : public IDspCore {
  void prepareProcessing(double sampleRate, uint32_t maxFrames) override {}
  void setParameter(uint32_t id, double value) override {}
  void noteOn(int noteNumber, double velocity) override {}
  void noteOff(int noteNumber) override {}
  void processAudio(float *bufferL, float *bufferR, uint32_t frames) override {}
};
