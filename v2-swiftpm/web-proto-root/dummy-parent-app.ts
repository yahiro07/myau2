import { MessageFromApp, MessageFromUi } from "@/bridge/message-types";
import { ParameterId } from "../dsp-dev/definitions/parameter_id";
import { createDspCoreWorkletWrapper } from "./dsp-dev-support/worklet-wrapper";

const windowTyped = window as unknown as {
  webkit?: {
    messageHandlers: {
      pluginEditor?: {
        postMessage: (msg: string | object) => void;
      };
    };
  };
  pluginEditorCallback?: (msg: MessageFromApp) => void;
};

const workletWrapper = createDspCoreWorkletWrapper();

const PK = ParameterId;

const draftParameterDefs: [number, string, number | boolean][] = [
  [PK.parametersVersion, "parametersVersion", 1],
  //
  [PK.osc1On, "osc1On", true],
  [PK.osc1Wave, "osc1Wave", 0],
  [PK.osc2Octave, "osc1Octave", 0.5],
  [PK.osc1PwMix, "osc1PwMix", 0.5],
  [PK.osc1Volume, "osc1Volume", 1],
  //
  [PK.osc2On, "osc2On", false],
  [PK.osc2Wave, "osc2Wave", 0],
  [PK.osc2Octave, "osc2Octave", 0.5],
  [PK.osc2Detune, "osc2Detune", 0.5],
  [PK.osc2Volume, "osc2Volume", 1],
  //
  [PK.filterOn, "filterOn", true],
  [PK.filterType, "filterType", 0],
  [PK.filterCutoff, "filterCutoff", 1],
  [PK.filterPeak, "filterPeak", 0],
  [PK.filterEnvMod, "filterEnvMod", 0],
  //
  [PK.ampOn, "ampOn", true],
  [PK.ampAttack, "ampAttack", 0],
  [PK.ampDecay, "ampDecay", 0],
  [PK.ampSustain, "ampSustain", 1],
  [PK.ampRelease, "ampRelease", 0],
  //
  [PK.lfoOn, "lfoOn", false],
  [PK.lfoWave, "lfoWave", 0],
  [PK.lfoRate, "lfoRate", 0.5],
  [PK.lfoDepth, "lfoDepth", 0.5],
  [PK.lfoTarget, "lfoTarget", 1],
  //
  [PK.egOn, "egOn", false],
  [PK.egAttack, "egAttack", 0.5],
  [PK.egDecay, "egDecay", 0.5],
  [PK.egAmount, "egAmount", 0.5],
  [PK.egTarget, "egTarget", 6],
  //
  [PK.glide, "glide", 0],
  [PK.voicingMode, "voicingMode", 0],
  [PK.masterVolume, "masterVolume", 0.5],
];

const parameterKeyToIdMap: Record<string, ParameterId> = Object.fromEntries(
  draftParameterDefs.map(([id, key]) => [key, id]),
);

function sendMessageToUi(msg: MessageFromApp) {
  windowTyped.pluginEditorCallback?.(msg);
}

function onMessageFromUi(msg: MessageFromUi) {
  console.log("msg received in dummyParentApp", msg);
  if (msg.type === "uiLoaded") {
    sendMessageToUi({ type: "standaloneAppFlag" });
    const parameters: Record<string, number> = {};
    draftParameterDefs.forEach(([_id, key, value]) => {
      parameters[key] = typeof value === "number" ? value : value ? 1 : 0;
    });
    sendMessageToUi({ type: "bulkSendParameters", parameters });
  } else if (msg.type === "performEdit") {
    const id = parameterKeyToIdMap[msg.paramKey];
    if (id !== undefined) {
      workletWrapper.setParameter(id, msg.value);
    }
  } else if (msg.type === "noteOnRequest") {
    workletWrapper.noteOn(msg.noteNumber, 1);
    sendMessageToUi({ type: "hostNoteOn", noteNumber: msg.noteNumber });
  } else if (msg.type === "noteOffRequest") {
    workletWrapper.noteOff(msg.noteNumber);
    sendMessageToUi({ type: "hostNoteOff", noteNumber: msg.noteNumber });
  }
}

windowTyped.webkit = {
  messageHandlers: {
    pluginEditor: {
      postMessage: (msg: string | object) => {
        onMessageFromUi(msg as MessageFromUi);
      },
    },
  },
};
console.log("dummy parent app initialized");
