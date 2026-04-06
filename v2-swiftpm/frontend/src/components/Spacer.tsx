import type { FC } from "react";
import { npx } from "../utils/styling-utils";

export const Spacer: FC<{ width?: number; height?: number }> = ({
  width,
  height,
}) => {
  return (
    <div
      style={{
        width: width ? npx(width) : undefined,
        height: height ? npx(height) : undefined,
      }}
    />
  );
};

export const FlexSpacer = () => {
  return <div css={{ flexGrow: 1 }} />;
};
