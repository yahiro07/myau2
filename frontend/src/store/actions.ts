import { agents } from "./agents";

export const actions = {
  noteOn(noteNumber: number) {
    agents.editorBridge.requestNoteOn(noteNumber);
  },
  noteOff(noteNumber: number) {
    agents.editorBridge.requestNoteOff(noteNumber);
  },
};
