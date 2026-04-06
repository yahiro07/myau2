#pragma once
#include "LowLevelPortalEvent.hpp"
#include "SPSCQueue.hpp"

class LowLevelPortalEventQueue {
private:
  SPSCQueue<LowLevelPortalEvent, 256> queue;

public:
  bool push(const LowLevelPortalEvent &e) { return queue.push(e); }
  bool pop(LowLevelPortalEvent &e) { return queue.pop(e); }
};