#include <cstdint>

enum class RtProcessorEventType { None = 0, Parameter };

struct RtProcessorEvent {
  RtProcessorEventType type;
  uint64_t address;
  float value;
};
