#pragma once

#include "./RtHostEvent.hpp"
#include "./RtProcessorEvent.hpp"
#include "./SpscQueue.hpp"
#import <AudioToolbox/AudioToolbox.h>
#import <CoreMIDI/CoreMIDI.h>
#import <algorithm>
#include <cstdlib>
#include <memory>
#import <span>

#include "../Dsp/dsp-core-entry.h"

/*
 PluginDSPKernel
 As a non-ObjC class, this is safe to use from render thread.
 */
class PluginDSPKernel {
private:
  // MARK: - Member Variables
  AUHostMusicalContextBlock mMusicalContextBlock;

  double mSampleRate = 44100.0;
  bool mBypassed = false;
  AUAudioFrameCount mMaxFramesToRender = 1024;
  double mCurrentTempo = 0.0;

  std::unique_ptr<IDspCore> mDspCore =
      std::unique_ptr<IDspCore>(createDspCoreInstance());

  SpscQueue<RtHostEvent, 256> rtHostEventQueue;
  SpscQueue<RtProcessorEvent, 256> rtProcessorEventQueue;

public:
  void initialize(int channelCount, double inSampleRate) {
    mSampleRate = inSampleRate;
    mDspCore->prepareProcessing(inSampleRate, mMaxFramesToRender);
  }

  void deInitialize() {}

  bool popRtHostEvent(RtHostEvent &outEvent) {
    return rtHostEventQueue.pop(outEvent);
  }

  void pushParameterChange(uint64_t address, float value) {
    rtProcessorEventQueue.push({RtProcessorEventType::ParameterChange,
                                .parameterChange = {address, value}});
  }

  void pushInternalNote(int noteNumber, float velocity) {
    rtProcessorEventQueue.push({RtProcessorEventType::InternalNote,
                                .internalNote = {noteNumber, velocity}});
  }

  void drainProcessorEvents() {
    RtProcessorEvent e;
    while (rtProcessorEventQueue.pop(e)) {
      if (e.type == RtProcessorEventType::ParameterChange) {
        mDspCore->setParameter(e.parameterChange.address,
                               e.parameterChange.value);
      } else if (e.type == RtProcessorEventType::InternalNote) {
        auto noteNumber = e.internalNote.noteNumber;
        auto velocity = e.internalNote.velocity;
        if (velocity > 0.0f) {
          mDspCore->noteOn(noteNumber, velocity);
          rtHostEventQueue.push({RtHostEventType::NoteOn, noteNumber,
                                 velocity}); // ack response to ui
        } else {
          mDspCore->noteOff(noteNumber);
          rtHostEventQueue.push({RtHostEventType::NoteOff, noteNumber,
                                 0.f}); //  ack response to ui
        }
      }
    }
  }

  // MARK: - Bypass
  bool isBypassed() { return mBypassed; }

  void setBypass(bool shouldBypass) { mBypassed = shouldBypass; }

  // MARK: - Parameter Getter / Setter
  void setParameter(AUParameterAddress address, AUValue value) {
    mDspCore->setParameter(address, value);
  }

  // MARK: - Max Frames
  AUAudioFrameCount maximumFramesToRender() const { return mMaxFramesToRender; }

  void setMaximumFramesToRender(const AUAudioFrameCount &maxFrames) {
    mMaxFramesToRender = maxFrames;
  }

  // MARK: - Musical Context
  void setMusicalContextBlock(AUHostMusicalContextBlock contextBlock) {
    mMusicalContextBlock = contextBlock;
  }

  // MARK: - MIDI Protocol
  MIDIProtocolID AudioUnitMIDIProtocol() const { return kMIDIProtocol_2_0; }

  /**
   MARK: - Internal Process

   This function does the core siginal processing.
   Do your custom DSP here.
   */
  void process(std::span<float *> outputBuffers,
               AUEventSampleTime bufferStartTime,
               AUAudioFrameCount frameCount) {
    if (false) {
      for (UInt32 frameIndex = 0; frameIndex < frameCount; ++frameIndex) {
        const auto sample = (rand() / (float)RAND_MAX) * 2.0 - 1.0;
        for (UInt32 channel = 0; channel < outputBuffers.size(); ++channel) {
          outputBuffers[channel][frameIndex] = sample;
        }
      }
      return;
    }

    if (mBypassed) {
      // Fill the 'outputBuffers' with silence
      for (UInt32 channel = 0; channel < outputBuffers.size(); ++channel) {
        std::fill_n(outputBuffers[channel], frameCount, 0.f);
      }
      return;
    }

    // Use this to get Musical context info from the Plugin Host,
    if (mMusicalContextBlock) {
      double currentTempo = 0.0;
      if (mMusicalContextBlock(&currentTempo /* currentTempo */,
                               nullptr /* timeSignatureNumerator */,
                               nullptr /* timeSignatureDenominator */,
                               nullptr /* currentBeatPosition */,
                               nullptr /* sampleOffsetToNextBeat */,
                               nullptr /* currentMeasureDownbeatPosition */)) {
        if (currentTempo != mCurrentTempo) {
          mCurrentTempo = currentTempo;
          rtHostEventQueue.push({RtHostEventType::Tempo,
                                 .tempo = static_cast<float>(currentTempo)});
        }
      }
    }

    if (outputBuffers.size() >= 2) {
      auto bufferL = outputBuffers[0];
      auto bufferR = outputBuffers[1];
      mDspCore->processAudio(bufferL, bufferR, frameCount);
    } else {
      auto bufferL = outputBuffers[0];
      mDspCore->processAudio(bufferL, bufferL, frameCount);
    }
  }

  void handleOneEvent(AUEventSampleTime now, AURenderEvent const *event) {
    if (event->head.eventType == AURenderEventParameter) {
      setParameter(event->parameter.parameterAddress, event->parameter.value);
    } else if (event->head.eventType == AURenderEventMIDIEventList) {
      handleMIDIEventList(now, &event->MIDIEventsList);
    }
  }

private:
  void handleMIDIEventList(AUEventSampleTime now,
                           AUMIDIEventList const *midiEvent) {
    auto visitor = [](void *context, MIDITimeStamp timeStamp,
                      MIDIUniversalMessage message) {
      auto thisObject = static_cast<PluginDSPKernel *>(context);
      if (message.type == kMIDIMessageTypeChannelVoice2) {
        thisObject->handleMIDI2VoiceMessage(message);
      }
    };

    MIDIEventListForEachEvent(&midiEvent->eventList, visitor, this);
  }

  void handleMIDI2VoiceMessage(const struct MIDIUniversalMessage &message) {
    const auto &note = message.channelVoice2.note;

    const auto &status = message.channelVoice2.status;

    if (status == kMIDICVStatusNoteOn) {
      auto velocity = (double)note.velocity /
                      (double)std::numeric_limits<std::uint16_t>::max();
      mDspCore->noteOn(note.number, velocity);

      rtHostEventQueue.push(
          {RtHostEventType::NoteOn, note.number, static_cast<float>(velocity)});
    } else if (status == kMIDICVStatusNoteOff) {
      mDspCore->noteOff(note.number);
      rtHostEventQueue.push({RtHostEventType::NoteOff, note.number, 0.f});
    }
  }
};
