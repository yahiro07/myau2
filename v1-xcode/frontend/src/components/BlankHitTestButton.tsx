import clsx from "clsx";

export const BlankHitTestButton = ({
  width,
  height,
  onClick,
  rounded,
  className,
  debugShowArea,
}: {
  width: string;
  height: string;
  onClick?(): void;
  rounded?: boolean;
  className?: string;
  debugShowArea?: boolean;
}) => {
  return (
    <button
      type="button"
      className={clsx(className, debugShowArea && "--debug-show-area")}
      css={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width,
        height,
        borderRadius: rounded ? "50%" : undefined,
        cursor: "pointer",
        "&.--debug-show-area": {
          border: "1px solid #00f",
        },
      }}
      onClick={onClick}
    />
  );
};
