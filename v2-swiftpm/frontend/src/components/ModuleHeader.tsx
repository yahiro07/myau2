import { css } from "@emotion/react";
import clsx from "clsx";
import { BlankHitTestButton } from "@/components/BlankHitTestButton";
import { flexAligned } from "@/utils/styling-utils";

export const ModuleHeaderLabel = ({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) => {
  return (
    <div css={cssModuleHeaderLabel} className={clsx(disabled && "--disabled")}>
      {label}
    </div>
  );
};
const cssModuleHeaderLabel = css({
  fontSize: "20px",
  fontWeight: "bold",
  color: "#333",
  "&.--disabled": {
    color: "#666",
  },
});

export const ModuleHeader = ({
  label,
  active,
  halfActive,
  onClick,
  altColor,
  className,
}: {
  label?: string;
  active?: boolean;
  halfActive?: boolean;
  onClick?: () => void;
  altColor?: boolean;
  className?: string;
}) => {
  return (
    <div css={styles.base} className={className}>
      <BlankHitTestButton
        width={"120%"}
        height={"140%"}
        css={{ borderRadius: "8px" }}
        onClick={onClick}
        // debugShowArea
      />
      <div
        css={styles.led}
        className={clsx(
          altColor && "--altColor",
          halfActive && "--half-active",
          active && "--active",
        )}
      />
      {label && <ModuleHeaderLabel label={label} disabled={!active} />}
    </div>
  );
};
const styles = {
  base: css({
    position: "relative",
    ...flexAligned(4),
    cursor: "pointer",
  }),
  led: css({
    width: "18px",
    aspectRatio: 1,
    border: "solid 2px #777",
    borderRadius: "50%",
    "&.--active": {
      background: "#0cc",
      border: "solid 1px #0aa",
    },
  }),
};
