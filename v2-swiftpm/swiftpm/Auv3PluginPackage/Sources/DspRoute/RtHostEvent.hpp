#pragma once

enum class RtHostEventType { None = 0, NoteOn, NoteOff, Tempo, PlayState };

struct RtHostEvent {
  RtHostEventType type;
  union {
    struct {
      int noteNumber;
      float velocity;
    } noteOn;
    struct {
      int noteNumber;
    } noteOff;
    struct {
      float tempo;
    } tempo;
    struct {
      bool isPlaying;
    } playState;
  };
};
