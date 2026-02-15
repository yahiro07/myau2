import { SelectorOption } from "@/common/selector-option";
import { UnitCell, UnitCellLabel } from "@/components/UnitCell";
import { useSelectorModel } from "@/hooks/use-selector-model";
import { flexCentered } from "@/utils/styling-utils";

export const SelectorPad = <T extends string | number>({
  values,
  options,
  value,
  onChange,
  label,
  bidirectional,
  unitSize = 1,
  usage = "normal",
}: {
  values?: T[];
  options?: SelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  bidirectional?: boolean;
  unitSize?: number;
  usage?: "normal" | "inHeader";
}) => {
  const { valueText, handleClick } = useSelectorModel({
    values,
    options,
    value,
    onChange,
    bidirectional,
  });
  if (usage === "inHeader") {
    return (
      <div className="flex-ha gap-2">
        <UnitCellLabel label={label} />
        <button
          type="button"
          css={{
            height: "30px",
            aspectRatio: unitSize,
            border: "inset 1px #0008",
            ...flexCentered(),
            fontWeight: 600,
            cursor: "pointer",
            background: "#666",
            color: "#fff",
          }}
          onClick={handleClick}
        >
          {valueText}
        </button>
      </div>
    );
  }
  return (
    <UnitCell label={label}>
      <button
        type="button"
        css={{
          height: "55px",
          aspectRatio: unitSize,
          border: "inset 1px #0008",
          ...flexCentered(),
          fontWeight: 600,
          cursor: "pointer",
          background: "#666",
          color: "#fff",
        }}
        onClick={handleClick}
      >
        {valueText}
      </button>
    </UnitCell>
  );
};
