export function greet() {
  console.log("dsp-dev hello");
}

let noteActive = false;

export function dspDev_processSamples(buffer: Float32Array, len: number) {
  if (!noteActive) {
    return;
  }
  for (let i = 0; i < len; i++) {
    buffer[i] = (Math.random() * 2 - 1) * 0.1;
  }
}

export function dspDev_noteOn(noteNumber: number, velocity: number) {
  noteActive = true;
  console.log("dspDev_noteOn", noteNumber, velocity);
}

export function dspDev_noteOff(_noteNumber: number) {
  noteActive = false;
  console.log("dspDev_noteOff");
}
