type RootPointerEvent = PointerEvent;

export type PointerPoint = {
  x: number;
  y: number;
};

export function startPointerCaptureSession(
  e0: RootPointerEvent,
  args: {
    onDown?(point: PointerPoint): void;
    onMove?(point: PointerPoint): void;
    onUp?(point: PointerPoint): void;
    onCancel?(point: PointerPoint): void;
    capture?: boolean;
  },
) {
  const { onDown, onMove, onUp, onCancel, capture = true } = args;
  const el = e0.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  let isSubscriptionActive = false;

  const getPointerPoint = (e: PointerEvent): PointerPoint => {
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId === e0.pointerId) {
      onMove?.(getPointerPoint(e));
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId === e0.pointerId) {
      // console.log(`pointerUp, ${e0.pointerId} ${e0.pointerType}`);
      onUp?.(getPointerPoint(e));
      unsubscribeListeners();
    }
  };

  const onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId === e0.pointerId) {
      // console.log(`pointerCancel, ${e0.pointerId} ${e0.pointerType}`);
      onCancel?.(getPointerPoint(e));
      unsubscribeListeners();
    }
  };

  const subscribeListeners = () => {
    // console.log(`start capture, ${e0.pointerId} ${e0.pointerType}`);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    if (capture) {
      // setPointerCaptureが失敗しても、windowのpointerup/cancelで終了できるようにする
      try {
        el.setPointerCapture(e0.pointerId);
      } catch {}
    }
    isSubscriptionActive = true;
  };

  const unsubscribeListeners = () => {
    if (isSubscriptionActive) {
      // releasePointerCaptureが例外を投げても後処理（listener解除）は必ず実行したい
      if (capture) {
        try {
          el.releasePointerCapture(e0.pointerId);
        } catch {}
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      // console.log(`end capture, ${e0.pointerId} ${e0.pointerType}`);
      isSubscriptionActive = false;
    }
  };

  onDown?.(getPointerPoint(e0));
  subscribeListeners();
}

// export function startPointerCaptureSessionD(
// 	e0: RootPointerEvent,
// 	args: {
// 		onDown?(e: { point: PointerPoint }): void;
// 		//relX, relY: relative to the initial position
// 		onMove?(e: { point: PointerPoint; relX: number; relY: number }): void;
// 		onUp?(e: { point: PointerPoint; relX: number; relY: number }): void;
// 		onCancel?(e: { point: PointerPoint }): void;
// 		capture?: boolean;
// 	},
// ) {
// 	let originPoint: PointerPoint | undefined;

// 	startPointerCaptureSession(e0, {
// 		...args,
// 		onDown(point) {
// 			originPoint = point;
// 		},
// 		onMove(point) {
// 			if (!originPoint) return;
// 			const relX = point.x - originPoint.x;
// 			const relY = point.y - originPoint.y;
// 			args.onMove?.({ point, relX, relY });
// 		},
// 		onUp(point) {
// 			if (!originPoint) return;
// 			const relX = point.x - originPoint.x;
// 			const relY = point.y - originPoint.y;
// 			args.onUp?.({ point, relX, relY });
// 		},
// 		onCancel(point) {
// 			args.onCancel?.({ point });
// 		},
// 	});
// }
