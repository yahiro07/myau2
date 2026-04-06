import { useMemo } from "react";
import { SelectorOption } from "@/common/selector-option";
import { clampValue } from "@/utils/number-utils";

export const useSelectorModel = <T extends string | number>({
  values: valuesInput,
  options: optionsInput,
  value,
  onChange,
  bidirectional,
  isVertical,
  isVerticalInverted,
}: {
  values?: T[];
  options?: SelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  bidirectional?: boolean;
  isVertical?: boolean;
  isVerticalInverted?: boolean;
}) => {
  const values = useMemo(() => {
    if (optionsInput) {
      return optionsInput.map((option) => option.value);
    }
    if (valuesInput) {
      return valuesInput;
    }
    return [];
  }, [optionsInput, valuesInput]);
  const index = values.indexOf(value);

  const valueText = useMemo(() => {
    if (optionsInput) {
      return optionsInput?.[index]?.label;
    }
    return value.toString();
  }, [optionsInput, index, value]);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    let nextIndex: number;
    if (bidirectional) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let dir = 1;
      if (isVertical) {
        if (isVerticalInverted) {
          dir = y < rect.height / 2 ? -1 : 1;
        } else {
          dir = y > rect.height / 2 ? -1 : 1;
        }
      } else {
        dir = x < rect.width / 2 ? -1 : 1;
      }
      nextIndex = clampValue(index + dir, 0, values.length - 1);
      if (nextIndex === index) return;
    } else {
      nextIndex = (index + 1 + values.length) % values.length;
    }
    const nextValue = values[nextIndex];
    onChange(nextValue);
  };
  let canShiftForward = index < values.length - 1;
  let canShiftBackward = index > 0;
  if (isVerticalInverted) {
    [canShiftForward, canShiftBackward] = [canShiftBackward, canShiftForward];
  }

  return { index, valueText, handleClick, canShiftForward, canShiftBackward };
};
