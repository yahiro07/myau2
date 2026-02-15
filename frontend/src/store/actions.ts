import { editorBridge } from "@/bridge/editor-bridge";

export const actions = {
  noteOn(noteNumber: number) {
    editorBridge.requestNoteOn(noteNumber);
  },
  noteOff(noteNumber: number) {
    editorBridge.requestNoteOff(noteNumber);
  },
};
