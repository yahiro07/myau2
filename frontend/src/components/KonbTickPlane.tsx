import { mapUnaryTo } from "@/utils/number-utils";

export const KnobTickPlane = ({
  value,
  tickHalfAngle,
  children,
}: {
  value: number;
  tickHalfAngle: number;
  children: React.ReactNode;
}) => {
  const angle = mapUnaryTo(value, -tickHalfAngle, tickHalfAngle);
  return (
    <div css={{ width: "100%", height: "100%" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          transform: `rotate(${angle}deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
