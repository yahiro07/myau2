export function copyBuffer(dstBuffer: Float32Array, srcBuffer: Float32Array) {
  for (let i = 0; i < dstBuffer.length; i++) {
    dstBuffer[i] = srcBuffer[i];
  }
}

export function writeBuffer(
  dstBuffer: Float32Array,
  srcBuffer: Float32Array,
  volume: number = 1,
) {
  for (let i = 0; i < dstBuffer.length; i++) {
    dstBuffer[i] += srcBuffer[i] * volume;
  }
}

export function applyBufferGain(buffer: Float32Array, gain: number) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] *= gain;
  }
}

export function applyBufferGainRms(buffer: Float32Array, numSources: number) {
  const gain = 1 / Math.sqrt(numSources);
  applyBufferGain(buffer, gain);
}
