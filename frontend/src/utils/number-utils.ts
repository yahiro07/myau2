export function clampValue(val: number, lo: number, hi: number) {
	if (val > hi) return hi;
	if (val < lo) return lo;
	return val;
}

export function linearInterpolate(
	val: number,
	s0: number,
	s1: number,
	d0: number,
	d1: number,
	applyClamp?: boolean,
) {
	const res = ((val - s0) / (s1 - s0)) * (d1 - d0) + d0;
	if (applyClamp) {
		const lo = Math.min(d0, d1);
		const hi = Math.max(d0, d1);
		return clampValue(res, lo, hi);
	}
	return res;
}

export function mapUnaryTo(val: number, d0: number, d1: number) {
	return val * (d1 - d0) + d0;
}
