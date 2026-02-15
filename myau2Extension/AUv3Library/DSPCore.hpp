#pragma once

class DSPCore {
public:
  // SwiftでDSPCoreの派生クラスから派生元のDSPCoreとしてのポインタを得る関数
  DSPCore *asDSPCorePointer() { return this; };

  virtual ~DSPCore() = default;

  // virtual void initialize(double sampleRate, int channelCount) = 0;
  virtual void setParameter(int address, float value) = 0;
  virtual void noteOn(int noteNumber, float velocity) = 0;
  virtual void noteOff(int noteNumber) = 0;

  virtual void process(float *leftBuffer, float *rightBuffer, int frames) = 0;
};
