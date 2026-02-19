export function greet() {
  console.log("dsp-dev hello");
}

export function processSamples(buffer: Float32Array, len: number) {
  for (let i = 0; i < len; i++) {
    buffer[i] = Math.random() * 2 - 1;
  }
}
