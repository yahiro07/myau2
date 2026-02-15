export function npx(value: number, fracDigits?: number) {
  if (fracDigits && Number.isFinite(fracDigits)) {
    return `${value.toFixed(fracDigits)}px`;
  } else {
    return `${value}px`;
  }
}

// export function ratioToPercent(ratio: number) {
// 	return `${(ratio * 100).toFixed(2)}%`;
// }

export function flexHorizontal(gap?: number) {
  return {
    display: "flex",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexAligned(gap?: number) {
  return {
    display: "flex",
    alignItems: "center",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexVertical(gap?: number) {
  return {
    display: "flex",
    flexDirection: "column",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexVerticalLeftAligned(gap?: number) {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexCentered(gap?: number) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexVerticalAligned(gap?: number) {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexVerticalCentered(gap?: number) {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function positionAbsoluteFull() {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  } as const;
}

// export function positionAbsoluteAnchored(
// 	anchor:
// 		| "topLeft"
// 		| "topRight"
// 		| "bottomLeft"
// 		| "bottomRight"
// 		| "topCenter"
// 		| "bottomCenter"
// 		| "leftCenter"
// 		| "rightCenter"
// 		| "center",
// ): CSSObject {
// 	if (anchor === "topLeft") {
// 		return {
// 			position: "absolute",
// 			top: 0,
// 			left: 0,
// 		};
// 	} else if (anchor === "topRight") {
// 		return {
// 			position: "absolute",
// 			top: 0,
// 			right: 0,
// 		};
// 	} else if (anchor === "bottomLeft") {
// 		return {
// 			position: "absolute",
// 			bottom: 0,
// 			left: 0,
// 		};
// 	} else if (anchor === "bottomRight") {
// 		return {
// 			position: "absolute",
// 			bottom: 0,
// 			right: 0,
// 		};
// 	} else if (anchor === "topCenter") {
// 		return {
// 			position: "absolute",
// 			top: 0,
// 			left: "50%",
// 			transform: "translateX(-50%)",
// 		};
// 	} else if (anchor === "bottomCenter") {
// 		return {
// 			position: "absolute",
// 			bottom: 0,
// 			left: "50%",
// 			transform: "translateX(-50%)",
// 		};
// 	} else if (anchor === "leftCenter") {
// 		return {
// 			position: "absolute",
// 			left: 0,
// 			top: "50%",
// 			transform: "translateY(-50%)",
// 		};
// 	} else if (anchor === "rightCenter") {
// 		return {
// 			position: "absolute",
// 			right: 0,
// 			top: "50%",
// 			transform: "translateY(-50%)",
// 		};
// 	} else if (anchor === "center") {
// 		return {
// 			position: "absolute",
// 			top: "50%",
// 			left: "50%",
// 			transform: "translate(-50%,-50%)",
// 		};
// 	} else {
// 		return {};
// 	}
// }

// export const sxGridLayeringBase = {
// 	display: "grid",
// 	placeItems: "center",
// 	" > *": {
// 		gridArea: "1 / 1",
// 	},
// };

// export const sxGridLayeringBaseFull = {
// 	display: "grid",
// 	placeItems: "center",
// 	" > *": {
// 		gridArea: "1 / 1",
// 		width: "100%",
// 		height: "100%",
// 	},
// };

// export const sxFullSize = {
// 	width: "100%",
// 	height: "100%",
// };

// export const sxPseudoContent = {
// 	display: "block",
// 	content: '""',
// };

// export const sxPseudoContentFull = {
// 	display: "block",
// 	content: '""',
// 	width: "100%",
// 	height: "100%",
// };
