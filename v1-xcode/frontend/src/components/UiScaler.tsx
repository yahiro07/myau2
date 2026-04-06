import type { FC } from "react";
import { useWindowSize } from "@/hooks/use-window-size";

export const UiScaler: FC<{
  children: React.ReactNode;
  scale: number;
  originalWidth: number;
  originalHeight: number;
}> = ({ children, scale, originalWidth, originalHeight }) => {
  if (scale === 1) return <>{children}</>;
  return (
    <div
      style={{
        position: "relative",
        // display: "inline-block",
        // verticalAlign: "top",
        display: "block",
        width: `${originalWidth * scale}px`,
        height: `${originalHeight * scale}px`,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
          width: `${originalWidth}px`,
          height: `${originalHeight}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// export const UiScalerAutoSized: FC<{
//   children: React.ReactNode;
//   scale: number;
// }> = ({ children, scale }) => {
//   const ref = useRef<HTMLDivElement>(null);
//   const [size, setSize] = useState<{ w: number; h: number } | null>(null);

//   // NOTE: CSS transform doesn't affect layout size.
//   // We observe the untransformed size and multiply by scale.
//   useLayoutEffect(() => {
//     if (scale === 1) {
//       setSize(null);
//       return;
//     }
//     const el = ref.current;
//     if (!el) return;

//     const round2 = (v: number) => Math.round(v * 100) / 100;
//     const ro = new ResizeObserver((entries) => {
//       const entry = entries[0];
//       if (!entry) return;
//       // `contentRect` is pre-transform; apply scale ourselves.
//       const w = round2(entry.contentRect.width * scale);
//       const h = round2(entry.contentRect.height * scale);
//       setSize((prev) => (prev?.w === w && prev?.h === h ? prev : { w, h }));
//     });
//     ro.observe(el);

//     return () => {
//       ro.disconnect();
//     };
//   }, [scale]);

//   if (scale === 1) return <>{children}</>;
//   return (
//     <div
//       style={{
//         position: "relative",
//         display: "inline-block",
//         width: size ? `${size.w}px` : "auto",
//         height: size ? `${size.h}px` : "auto",
//       }}
//     >
//       <div
//         ref={ref}
//         style={{
//           transform: `scale(${scale})`,
//           transformOrigin: "0 0",
//           // Remove the scaled node from flow so it doesn't reserve unscaled size.
//           position: "absolute",
//           top: 0,
//           left: 0,
//         }}
//       >
//         {children}
//       </div>
//     </div>
//   );
// };

export const ScreenUiScaler: FC<{
  children: React.ReactNode;
  designWidth: number;
  designHeight: number;
}> = ({ children, designWidth, designHeight }) => {
  const win = useWindowSize();
  const scale = Math.min(win.width / designWidth, win.height / designHeight);
  return (
    <UiScaler
      scale={scale}
      originalWidth={designWidth}
      originalHeight={designHeight}
    >
      {children}
    </UiScaler>
  );
};
