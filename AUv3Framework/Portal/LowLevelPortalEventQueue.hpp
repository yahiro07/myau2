#pragma once
#include "SPSCQueue.hpp"

enum class LowLevelPortalEventType {
  None = 0,
  NoteOn,
  NoteOff,
  Tempo,
  PlayState
};

struct LowLevelPortalEvent {
  LowLevelPortalEventType type;
  int data1;   // noteNumber, playState(0 or 1)
  float data2; // velocity(0.0~1.0), tempo
};

class LowLevelPortalEventQueue {
private:
  SPSCQueue<LowLevelPortalEvent, 256> queue;

public:
  bool push(const LowLevelPortalEvent &e) { return queue.push(e); }
  bool pop(LowLevelPortalEvent &e) { return queue.pop(e); }
};