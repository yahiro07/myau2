import { css } from "@emotion/react";
import { KnobTickPlane } from "@/components/KonbTickPlane";
import { UiScaler } from "@/components/UiScaler";
import { UnitCell } from "@/components/UnitCell";
import { useKnobModel } from "@/hooks/use-knob-model";
import { flexCentered, npx } from "@/utils/styling-utils";

const configs = {
  knobDiameter: 55,
};

const KnobView = ({
  value,
  children,
  handlePointerDown,
}: {
  value: number;
  children?: React.ReactNode;
  handlePointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}) => {
  return (
    <div css={knobStyles.base} onPointerDown={handlePointerDown}>
      <div css={knobStyles.body}>
        <div />
      </div>
      {children}
      <div css={knobStyles.tickPlaneOuter}>
        <KnobTickPlane value={value} tickHalfAngle={140}>
          <div css={knobStyles.tick} />
        </KnobTickPlane>
      </div>
    </div>
  );
};
const knobStyles = {
  base: css({
    position: "relative",
    cursor: "pointer",
    width: npx(configs.knobDiameter),
    aspectRatio: 1,
    "> *": {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
    },
  }),
  body: css({
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    ...flexCentered(),
    border: "solid 2px #1114",
    "> div": {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: "solid 4px #777",
      background: "#999",
    },
  }),
  tickPlaneOuter: css({
    width: "100%",
    height: "100%",
    padding: "3px",
  }),
  tick: css({
    width: npx(3),
    height: npx(12),
    background: "#fff",
  }),
};

export const Knob = ({
  value,
  label,
  onChange,
  size = "md",
  min,
  max,
  step,
  // onTouch,
  onStartEdit,
  onEndEdit,
}: {
  value: number;
  label: string;
  onChange?: (value: number) => void;
  size?: "md" | "sm" | "xs" | "xxs";
  min?: number;
  max?: number;
  step?: number;
  // onTouch?: () => void;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
}) => {
  const { normValue, handlePointerDown } = useKnobModel({
    value,
    onChange,
    min,
    max,
    step,
    // onTouch,
    onStartEdit,
    onEndEdit,
  });
  const scale = {
    md: 1,
    sm: 0.88,
    xs: 0.8,
    xxs: 0.75,
  }[size];
  const sz = configs.knobDiameter;
  return (
    <UiScaler scale={scale} originalWidth={sz} originalHeight={sz}>
      <UnitCell label={label}>
        <KnobView value={normValue} handlePointerDown={handlePointerDown} />
      </UnitCell>
    </UiScaler>
  );
};
