#include <cstdint>

enum class RtProcessorEventType { None = 0, ParameterChange, InternalNote };

struct RtProcessorEvent {
  RtProcessorEventType type;
  union {
    struct {
      uint64_t address;
      float value;
    } parameterChange;
    struct {
      int noteNumber;
      float velocity; // 0 for noteOff
    } internalNote;
  };
};
