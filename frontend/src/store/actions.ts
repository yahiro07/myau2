import { agents } from "./agents";

export const actions = {
  noteOn(noteNumber: number) {
    agents.editorBridge.requestNoteOn(noteNumber);
  },
  noteOff(noteNumber: number) {
    agents.editorBridge.requestNoteOff(noteNumber);
  },
  saveCurrentPresetToSlot(slot: number) {
    agents.presetManager.savePreset(`preset${slot}`);
  },
  loadPresetFromSlot(slot: number) {
    agents.presetManager.loadPreset(`preset${slot}`);
  },
};
