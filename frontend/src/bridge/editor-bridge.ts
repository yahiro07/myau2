import { createCoreBridge } from "@/bridge/core-bridge";
import { logger } from "@/bridge/logger";
import {
  defaultSynthParameters,
  ParameterKey,
  SynthParametersSuit,
} from "@/store/parameters";
import { store } from "@/store/store";

type EditorBridge = {
  requestNoteOn(noteNumber: number): void;
  requestNoteOff(noteNumber: number): void;
  setupReceivers(): () => void;
};

function createEditorBridge(): EditorBridge {
  const coreBridge = createCoreBridge();

  function setupReceivers() {
    let isReceiving = false;
    const parameterKeys = new Set(Object.keys(defaultSynthParameters));
    let editTargetSent: ParameterKey | undefined;

    //ストアの値を購読して変更があったときに本体に通知する
    const unsubscribeStore = store.subscribe((attrs) => {
      if (isReceiving) return;

      const { editTarget, ...paramAttrs } = attrs;

      if (editTarget !== undefined) {
        if (editTarget !== null) {
          coreBridge.sendMessage({
            type: "beginParameterEdit",
            paramKey: editTarget,
          });
          editTargetSent = editTarget;
        } else if (editTargetSent) {
          coreBridge.sendMessage({
            type: "endParameterEdit",
            paramKey: editTargetSent,
          });
          editTargetSent = undefined;
        }
      }

      for (const [key, value] of Object.entries(paramAttrs)) {
        if (
          parameterKeys.has(key) &&
          (typeof value === "number" || typeof value === "boolean")
        ) {
          const sendingValue =
            typeof value === "boolean" ? (value ? 1 : 0) : value;

          logger.log("sending parameter change to app", { key, sendingValue });
          coreBridge.sendMessage({
            type: "setParameter",
            paramKey: key,
            value: sendingValue,
          });
        }
      }
    });

    function affectParameterToStore(paramKey: string, value: number) {
      if (parameterKeys.has(paramKey)) {
        const paramType =
          defaultSynthParameters[paramKey as keyof SynthParametersSuit];
        const castedValue =
          typeof paramType === "boolean" ? value >= 0.5 : value;
        store.mutations.assigns({ [paramKey]: castedValue });
      } else {
        logger.log("unknown parameter key from app:", paramKey);
      }
    }

    const unsubscribeCoreBridge = coreBridge.assignReceiver((msg) => {
      //本体からパラメタを受け取ってstoreを更新したときにもsubscribeのコールバックが
      //呼ばれるので、そこで値を送り返さないようにフラグを立てて処理を抑制する
      isReceiving = true;
      logger.log("message from app", { msg });
      if (msg.type === "setParameter") {
        const { paramKey, value } = msg;
        affectParameterToStore(paramKey, value);
      } else if (msg.type === "bulkSetParameters") {
        for (const [paramKey, value] of Object.entries(msg.parameters)) {
          //store.mutations.*はバッチ化で単一の更新にまとめるので連続で多数呼んでよい
          affectParameterToStore(paramKey, value);
        }
      } else if (msg.type === "hostNoteOn") {
        logger.log(`hostNoteOn: ${msg.noteNumber}, ${msg.velocity}`);
      } else if (msg.type === "hostNoteOff") {
        logger.log(`hostNoteOff: ${msg.noteNumber}`);
      } else if (msg.type === "standaloneAppFlag") {
        logger.log("Received standalone app flag from host");
        store.mutations.setStandaloneFlag(true);
      }
      //snap-storeの状態を更新したあと、別タスクでsubscribeのコールバックが呼ばれるので
      //これが終わった後にisReceivingをfalseにする(queueMicrotaskはFIFO順で処理される)
      queueMicrotask(() => {
        isReceiving = false;
      });
    });

    coreBridge.sendMessage({ type: "uiLoaded" });

    return () => {
      unsubscribeStore();
      unsubscribeCoreBridge();
    };
  }
  function requestNoteOn(noteNumber: number) {
    coreBridge.sendMessage({ type: "noteOnRequest", noteNumber });
  }
  function requestNoteOff(noteNumber: number) {
    coreBridge.sendMessage({ type: "noteOffRequest", noteNumber });
  }

  return {
    requestNoteOn,
    requestNoteOff,
    setupReceivers,
  };
}
export const editorBridge = createEditorBridge();
