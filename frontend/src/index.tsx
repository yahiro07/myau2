import { css } from "@emotion/react";
import reactDOM from "react-dom/client";
import { Knob, ModuleHeader, SelectorPad } from "@/components";
import { FlexSpacer } from "@/components/Spacer";
import {
  filterTypeOptions,
  lfoWaveOptions,
  modTargetOptions,
  oscWaveOptions,
  VoicingModeOptions,
} from "@/store/parameters";
import { store } from "@/store/store";
import { flexCentered, flexVertical } from "@/utils/styling-utils";
import "@/styles/utility-classes.css";
import "@/styles/page.css";
import { useEffect } from "react";
import { logger } from "@/bridge/logger";
import { ScreenUiScaler } from "@/components/UiScaler";
import { fetchAssetsJson } from "@/preset-manager/factory-preset-provider";
import { actions } from "@/store/actions";
import { agents } from "@/store/agents";

const cssSectionFrame = css({
  padding: "20px 35px",
  border: "solid 2px #444",
  borderRadius: "8px",
  // background: "#bbb",
  ...flexVertical(12),
});

function useOscViewModel(oscId: "osc1" | "osc2") {
  const st = store.useSnapshot();
  const mt = store.mutations;
  return {
    on: oscId === "osc1" ? st.osc1On : st.osc2On,
    setOn: oscId === "osc1" ? mt.setOsc1On : mt.setOsc2On,
    wave: oscId === "osc1" ? st.osc1Wave : st.osc2Wave,
    setWave: oscId === "osc1" ? mt.setOsc1Wave : mt.setOsc2Wave,
    octave: oscId === "osc1" ? st.osc1Octave : st.osc2Octave,
    setOctave: oscId === "osc1" ? mt.setOsc1Octave : mt.setOsc2Octave,
    volume: oscId === "osc1" ? st.osc1Volume : st.osc2Volume,
    setVolume: oscId === "osc1" ? mt.setOsc1Volume : mt.setOsc2Volume,
    osc1PwMix: st.osc1PwMix,
    setOsc1PwMix: mt.setOsc1PwMix,
    osc2Detune: st.osc2Detune,
    setOsc2Detune: mt.setOsc2Detune,
    startEditOctave: () =>
      mt.setEditTarget(oscId === "osc1" ? "osc1Octave" : "osc2Octave"),
    startEditPwMix: () => mt.setEditTarget("osc1PwMix"),
    startEditDetune: () => mt.setEditTarget("osc2Detune"),
    startEditVolume: () =>
      mt.setEditTarget(oscId === "osc1" ? "osc1Volume" : "osc2Volume"),
    endEdit: () => mt.setEditTarget(null),
  };
}

const OscSection = ({ oscId }: { oscId: "osc1" | "osc2" }) => {
  const vm = useOscViewModel(oscId);
  return (
    <div css={cssSectionFrame}>
      <div className="flex-ha">
        <ModuleHeader
          label={oscId.toUpperCase()}
          active={vm.on}
          onClick={() => vm.setOn(!vm.on)}
        />
        <FlexSpacer />
        {false && (
          <SelectorPad
            label="Wave"
            options={oscWaveOptions}
            value={vm.wave}
            onChange={vm.setWave}
            usage="inHeader"
            unitSize={2}
          />
        )}
      </div>
      <div className="flex-h gap-10">
        <SelectorPad
          label="Wave"
          options={oscWaveOptions}
          value={vm.wave}
          onChange={vm.setWave}
        />
        <Knob
          label="Octave"
          value={vm.octave}
          onChange={vm.setOctave}
          step={0.25}
          onStartEdit={vm.startEditOctave}
          onEndEdit={vm.endEdit}
        />
        {oscId === "osc1" && (
          <Knob
            label="PW"
            value={vm.osc1PwMix}
            onChange={vm.setOsc1PwMix}
            onStartEdit={vm.startEditPwMix}
            onEndEdit={vm.endEdit}
          />
        )}
        {oscId === "osc2" && (
          <Knob
            label="Detune"
            value={vm.osc2Detune}
            onChange={vm.setOsc2Detune}
            onStartEdit={vm.startEditDetune}
            onEndEdit={vm.endEdit}
          />
        )}
        <Knob
          label="Volume"
          value={vm.volume}
          onChange={vm.setVolume}
          onStartEdit={vm.startEditVolume}
          onEndEdit={vm.endEdit}
        />
      </div>
    </div>
  );
};

const FilterSection = () => {
  const st = store.useSnapshot();
  const mt = store.mutations;
  return (
    <div css={cssSectionFrame}>
      <div className="flex-ha">
        <ModuleHeader
          label="Filter"
          active={st.filterOn}
          onClick={mt.toggleFilterOn}
        />
        <FlexSpacer />
        {false && (
          <SelectorPad
            label="Type"
            options={filterTypeOptions}
            value={st.filterType}
            onChange={mt.setFilterType}
            usage="inHeader"
            unitSize={2}
          />
        )}
      </div>
      <div className="flex-h gap-10">
        <SelectorPad
          label="Type"
          options={filterTypeOptions}
          value={st.filterType}
          onChange={mt.setFilterType}
        />
        <Knob
          label="Cutoff"
          value={st.filterCutoff}
          onChange={mt.setFilterCutoff}
          onStartEdit={() => mt.setEditTarget("filterCutoff")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Peak"
          value={st.filterPeak}
          onChange={mt.setFilterPeak}
          onStartEdit={() => mt.setEditTarget("filterPeak")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="EnvMod"
          value={st.filterEnvMod}
          onChange={mt.setFilterEnvMod}
          onStartEdit={() => mt.setEditTarget("filterEnvMod")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
      </div>
    </div>
  );
};

const AmplifierSection = () => {
  const st = store.useSnapshot();
  const mt = store.mutations;
  return (
    <div css={cssSectionFrame}>
      <div className="flex-ha">
        <ModuleHeader
          label="Amplifier"
          active={st.ampOn}
          onClick={mt.toggleAmpOn}
        />
      </div>
      <div className="flex-h gap-10">
        <Knob
          label="Attack"
          value={st.ampAttack}
          onChange={mt.setAmpAttack}
          onStartEdit={() => mt.setEditTarget("ampAttack")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Decay"
          value={st.ampDecay}
          onChange={mt.setAmpDecay}
          onStartEdit={() => mt.setEditTarget("ampDecay")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Sustain"
          value={st.ampSustain}
          onChange={mt.setAmpSustain}
          onStartEdit={() => mt.setEditTarget("ampSustain")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Release"
          value={st.ampRelease}
          onChange={mt.setAmpRelease}
          onStartEdit={() => mt.setEditTarget("ampRelease")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
      </div>
    </div>
  );
};

const LfoSection = () => {
  const st = store.useSnapshot();
  const mt = store.mutations;
  return (
    <div css={cssSectionFrame}>
      <div className="flex-ha">
        <ModuleHeader label="LFO" active={st.lfoOn} onClick={mt.toggleLfoOn} />
        <FlexSpacer />
        {false && (
          <SelectorPad
            usage="inHeader"
            label="Dest"
            options={modTargetOptions}
            value={st.lfoTarget}
            onChange={mt.setLfoTarget}
            unitSize={4}
          />
        )}
      </div>
      <div className="flex-h gap-12">
        <SelectorPad
          label="Wave"
          options={lfoWaveOptions}
          value={st.lfoWave}
          onChange={mt.setLfoWave}
        />
        <Knob
          label="Rate"
          value={st.lfoRate}
          onChange={mt.setLfoRate}
          onStartEdit={() => mt.setEditTarget("lfoRate")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Depth"
          value={st.lfoDepth}
          onChange={mt.setLfoDepth}
          onStartEdit={() => mt.setEditTarget("lfoDepth")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        {true && (
          <SelectorPad
            label="Target"
            options={modTargetOptions}
            value={st.lfoTarget}
            onChange={mt.setLfoTarget}
            unitSize={2}
          />
        )}
      </div>
    </div>
  );
};

const ModEgSection = () => {
  const st = store.useSnapshot();
  const mt = store.mutations;
  return (
    <div css={cssSectionFrame}>
      <div className="flex-ha">
        <ModuleHeader label="Mod EG" active={st.egOn} onClick={mt.toggleEgOn} />
        <FlexSpacer />
        {false && (
          <SelectorPad
            label="Dest"
            options={modTargetOptions}
            value={st.egTarget}
            onChange={mt.setEgTarget}
            usage="inHeader"
            unitSize={4}
          />
        )}
      </div>
      <div className="flex-h gap-12">
        <Knob
          label="Attack"
          value={st.egAttack}
          onChange={mt.setEgAttack}
          onStartEdit={() => mt.setEditTarget("egAttack")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Decay"
          value={st.egDecay}
          onChange={mt.setEgDecay}
          onStartEdit={() => mt.setEditTarget("egDecay")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Amount"
          value={st.egAmount}
          onChange={mt.setEgAmount}
          onStartEdit={() => mt.setEditTarget("egAmount")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        {true && (
          <SelectorPad
            label="Dest"
            options={modTargetOptions}
            value={st.egTarget}
            onChange={mt.setEgTarget}
            unitSize={2}
          />
        )}
      </div>
    </div>
  );
};

const VoiceControlSection = () => {
  const st = store.useSnapshot();
  const mt = store.mutations;
  return (
    <div css={cssSectionFrame} className="grow flex-c">
      <div className="flex-vc gap-6">
        <Knob
          label="Master"
          value={st.masterVolume}
          onChange={mt.setMasterVolume}
          onStartEdit={() => mt.setEditTarget("masterVolume")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <Knob
          label="Glide"
          value={st.glide}
          onChange={mt.setGlide}
          onStartEdit={() => mt.setEditTarget("glide")}
          onEndEdit={() => mt.setEditTarget(null)}
        />
        <SelectorPad
          label="Voicing"
          options={VoicingModeOptions}
          value={st.voicingMode}
          onChange={mt.setVoicingMode}
        />
      </div>
    </div>
  );
};

const ParametersEditPart = () => {
  const st = store.useSnapshot();
  return (
    <div
      css={{
        width: "1080px",
        height: "600px",
        border: "solid 1px #fff4",
        fontFamily: "Inter, sans-serif",
        background: "#888",
        color: "#333",
        fontWeight: "500",
        h3: {
          fontSize: "20px",
          fontWeight: "bold",
        },
        position: "relative",
        ...flexCentered(),
      }}
    >
      <div className="flex-v gap-4">
        <div className="flex gap-4">
          <div className="flex-v gap-4">
            <div className="flex-ha gap-4">
              <OscSection oscId="osc1" />
              <FilterSection />
            </div>
            <div className="flex-ha gap-4">
              <OscSection oscId="osc2" />
              <AmplifierSection />
            </div>
          </div>
          <VoiceControlSection />
        </div>
        <div className="flex-ha gap-4">
          <ModEgSection />
          <LfoSection />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 p-1">myau2 web ui - 1723</div>
      <div className="absolute bottom-0 left-0 p-1">
        {st.standaloneFlag && "standalone mode"}
      </div>
    </div>
  );
};

const KeyboardPart = () => {
  const st = store.useSnapshot();
  return (
    <div
      css={{
        width: "1080px",
        height: "200px",
        border: "solid 1px #fff4",
        fontFamily: "Inter, sans-serif",
        background: "#aaa",
        color: "#333",
        fontWeight: "500",
        h3: {
          fontSize: "20px",
          fontWeight: "bold",
        },
        button: {
          width: "80px",
          height: "60px",
          background: "#fff",
          border: "solid 1px #888",
          cursor: "pointer",
        },
      }}
      className="flex-c gap-10"
    >
      <div className="flex-v gap-4">
        <div className="flex-ha gap-10">
          <div className="flex-ha gap-2">
            <button
              type="button"
              onPointerDown={() => actions.noteOn(60)}
              onPointerUp={() => actions.noteOff(60)}
            >
              C
            </button>
            <button
              type="button"
              onPointerDown={() => actions.noteOn(62)}
              onPointerUp={() => actions.noteOff(62)}
            >
              D
            </button>
            <button
              type="button"
              onPointerDown={() => actions.noteOn(64)}
              onPointerUp={() => actions.noteOff(64)}
            >
              E
            </button>
          </div>
          <div className="flex-ha gap-2">
            <button type="button" onClick={() => actions.loadPresetFromSlot(1)}>
              load preset 1
            </button>
            <button
              type="button"
              onClick={() => actions.saveCurrentPresetToSlot(1)}
            >
              save preset 1
            </button>
            <button type="button" onClick={() => actions.loadPresetFromSlot(2)}>
              load preset 2
            </button>
            <button
              type="button"
              onClick={() => actions.saveCurrentPresetToSlot(2)}
            >
              save preset 2
            </button>
          </div>
        </div>
        <div className="flex-ha gap-2">
          <button
            type="button"
            onClick={() => {
              agents.stateKvs.write("testKey", "hello world");
              logger.log("state kvs write: testKey = hello world");
            }}
          >
            state kvs set
          </button>
          <button
            type="button"
            onClick={() => {
              const value = agents.stateKvs.read("testKey");
              logger.log(`state kvs read: ${value}`);
            }}
          >
            state kvs get
          </button>

          <button
            type="button"
            onClick={() => {
              agents.sharedKvs.write("testKey1", "hello world1");
              logger.log("shared kvs write: testKey1 = hello world1");
            }}
          >
            shared kvs set
          </button>
          <button
            type="button"
            onClick={() => {
              const value = agents.sharedKvs.read("testKey1");
              logger.log(`shared kvs read: ${value}`);
            }}
          >
            shared kvs get
          </button>
          <div>lpk: {st.lastLoadedPresetKey}</div>
          <button
            type="button"
            onClick={async () => {
              try {
                const json = await fetchAssetsJson("/presets/meta.json");
                logger.log(`fetched meta.json: ${JSON.stringify(json)}`);
              } catch (e) {
                logger.logError(e, "error@fetching meta.json");
              }
            }}
          >
            debug fetch json
          </button>
        </div>
      </div>
      <div>
        {st.presetItems.map((item) => (
          <div
            key={item.presetKey}
            css={{
              border: "solid 1px #888",
            }}
            onClick={() => agents.presetManager.loadPreset(item.presetKey)}
          >
            {item.presetKey} {item.presetName} ({item.presetKind})
            {item.presetKey === st.lastLoadedPresetKey && "<- loaded"}
          </div>
        ))}
      </div>
    </div>
  );
};

const ExtensionView = () => {
  return (
    <ScreenUiScaler designWidth={1080} designHeight={600}>
      <div className="flex-c">
        <ParametersEditPart />
      </div>
    </ScreenUiScaler>
  );
};

const StandaloneView = () => {
  return (
    <ScreenUiScaler designWidth={1080} designHeight={800}>
      <div className="flex-vc">
        <ParametersEditPart />
        <KeyboardPart />
      </div>
    </ScreenUiScaler>
  );
};

const App = () => {
  useEffect(agents.setup, []);
  useEffect(() => void agents.initialLoad(), []);
  const st = store.useSnapshot();
  return (
    <div className="h-dvh flex-c" css={{ background: "#444" }}>
      {st.standaloneFlag || 1 ? <StandaloneView /> : <ExtensionView />}
    </div>
  );
};

async function start() {
  logger.log("UI 0033");
  logger.log(`at: ${location.href}`);
  const rootDiv = document.getElementById("app");
  if (!rootDiv) {
    document.body.innerHTML = "no root element found";
    return;
  }
  reactDOM.createRoot(rootDiv).render(<App />);
}

start();
