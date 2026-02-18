#pragma once 

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
