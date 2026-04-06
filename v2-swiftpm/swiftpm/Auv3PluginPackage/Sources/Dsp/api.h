#include <cstdint>

class IDspCore {
public:
  virtual ~IDspCore() = default;
  virtual void prepareProcessing(double sampleRate, uint32_t maxFrames) = 0;
  virtual void setParameter(uint32_t id, double value) = 0;
  virtual void noteOn(int noteNumber, double velocity) = 0;
  virtual void noteOff(int noteNumber) = 0;
  virtual void processAudio(float *bufferL, float *bufferR,
                            uint32_t frames) = 0;
};
