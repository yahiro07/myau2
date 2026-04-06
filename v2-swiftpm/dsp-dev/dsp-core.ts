import { IDspCore } from "./api";

export enum ParameterId {
  parametersVersion = 1,
  oscEnabled,
  oscWave,
  oscPitch,
  oscVolume,
}

enum OscWave {
  Saw = 0,
  Square,
  Sine,
  Noise
}

type ParametersSuit = {
  oscEnabled: boolean;
  oscWave: OscWave;
  oscPitch: number;
  oscVolume: number;
}

export class DspCore implements IDspCore {
  sampleRate: number = 0.0;
  noteNumber: number = 60;
  gateOn: boolean = false;
  parameters: ParametersSuit = {
    oscEnabled: true,
    oscWave: OscWave.Saw,
    oscPitch: 0.5,
    oscVolume: 0.5,
  }
  phase: number = 0.0;

  prepareProcessing(sampleRate: number, maxFrames: number): void {
    this.sampleRate = sampleRate;
  }
  setParameter(id: number, value: number): void {
    if (id === ParameterId.oscEnabled) {
      this.parameters.oscEnabled = value > 0.5;
    } else if (id === ParameterId.oscWave) {
      this.parameters.oscWave = value;
    } else if (id === ParameterId.oscPitch) {
      this.parameters.oscPitch = value;
    } else if (id === ParameterId.oscVolume) {
      this.parameters.oscVolume = value;
    }
  }
  noteOn(noteNumber: number, velocity: number): void {
    this.noteNumber = noteNumber;
    this.gateOn = true;
  }
  noteOff(noteNumber: number): void {
    if (noteNumber === this.noteNumber) {
      this.gateOn = false;
    }
  }
  processAudio(
    bufferL: Float32Array,
    bufferR: Float32Array,
    frames: number,
  ): void {
    if (this.sampleRate === 0.0) return;
    const noteNumber = this.noteNumber + this.parameters.oscPitch * 24 - 12;
    const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
    const phaseInc = freq / this.sampleRate;
    const gain = this.gateOn && this.parameters.oscEnabled ? this.parameters.oscVolume : 0;

    for (let i = 0; i < frames; i++) {
      this.phase += phaseInc;
      this.phase -= Math.floor(this.phase);
      let y = 0;
      if (this.parameters.oscWave === OscWave.Saw) {
        y = 1 - this.phase;
      } else if (this.parameters.oscWave === OscWave.Square) {
        y = this.phase < 0.5 ? 1 : -1;
      } else if (this.parameters.oscWave === OscWave.Sine) {
        y = Math.sin(2 * Math.PI * this.phase);
      } else if (this.parameters.oscWave === OscWave.Noise) {
        y = Math.random() * 2 - 1;
      }
      y *= gain;
      bufferL[i] = y;
      bufferR[i] = y;
    }
  }
}
