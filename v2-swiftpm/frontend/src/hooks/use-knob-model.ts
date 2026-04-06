import { useState } from "react";
import { clampValue, linearInterpolate } from "@/utils/number-utils";
import type { PointerPoint } from "@/utils/pointer-capture-session";
import { startPointerCaptureSession } from "@/utils/pointer-capture-session";

export function useKnobModel(props: {
  value: number;
  onChange?: (value: number) => void;
  onChangeComplete?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  dragRange?: number;
  reverseDragDirection?: boolean;
  onTap?: () => void;
  onTouch?: () => void;
  tickDisplaySteps?: number;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
}) {
  const {
    value: originalValue,
    onChange,
    onChangeComplete,
    min = 0,
    max = 1,
    step,
    dragRange = 100,
    reverseDragDirection,
    onTap,
    onTouch,
    tickDisplaySteps,
    onStartEdit,
    onEndEdit,
  } = props;

  const [editValue, setEditValue] = useState<number | undefined>(undefined);

  const m = {
    handlePointerDown(e0: React.PointerEvent<HTMLElement>) {
      let originalPos: PointerPoint;
      let localEditValue: number;
      let dragStartTime: number;
      let dragTotalDistance: number;

      onTouch?.();

      startPointerCaptureSession(e0.nativeEvent, {
        onDown(point) {
          originalPos = point;
          setEditValue(originalValue);
          localEditValue = originalValue;
          dragStartTime = Date.now();
          dragTotalDistance = 0;
          onStartEdit?.();
        },
        onMove(point) {
          const diffXY = {
            x: point.x - originalPos.x,
            y: point.y - originalPos.y,
          };
          let shiftAmount = clampValue(
            (diffXY.x - diffXY.y) / dragRange,
            -1,
            1,
          );
          if (reverseDragDirection) {
            shiftAmount *= -1;
          }
          const range = max - min;
          let newValue = clampValue(
            originalValue + shiftAmount * range,
            min,
            max,
          );
          if (step) {
            newValue = Math.round(newValue / step) * step;
          }
          setEditValue(newValue);
          localEditValue = newValue;
          onChange?.(newValue);
          dragTotalDistance += Math.hypot(diffXY.x, diffXY.y);
        },
        onUp() {
          const duration = Date.now() - dragStartTime;
          if (dragTotalDistance < 10 && duration < 300) {
            onTap?.();
          } else {
            if (localEditValue !== originalValue) {
              onChangeComplete?.(localEditValue);
            }
          }
          setEditValue(undefined);
          onEndEdit?.();
        },
      });
    },
  };
  const displaySourceValue = editValue ?? originalValue;
  let normValue = linearInterpolate(displaySourceValue, min, max, 0, 1);
  if (tickDisplaySteps) {
    normValue = Math.round(normValue * tickDisplaySteps) / tickDisplaySteps;
  }
  return {
    handlePointerDown: m.handlePointerDown,
    normValue,
  };
}
