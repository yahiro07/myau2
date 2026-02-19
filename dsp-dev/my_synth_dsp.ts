type DSPCore = {
  setParametersVersion(version: number): void;
  setParameter(address: number, value: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  process(bufferL: Float32Array, bufferR: Float32Array, len: number): void;
};

function createMySynthDSP(): DSPCore {
  let noteActive = false;
  return {
    setParametersVersion(_version) {},
    setParameter(_address, _value) {},
    noteOn(_noteNumber, _velocity) {
      noteActive = true;
    },
    noteOff(_noteNumber) {
      noteActive = false;
    },
    process(bufferL, bufferR, len) {
      if (!noteActive) {
        return;
      }
      for (let i = 0; i < len; i++) {
        bufferL[i] = (Math.random() * 2 - 1) * 0.1;
        bufferR.set(bufferL);
      }
    },
  };
}

export function createDSPCoreInstance(): DSPCore {
  return createMySynthDSP();
}
