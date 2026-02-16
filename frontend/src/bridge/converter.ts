export const parametersConverter = {
  mapStoreParametersToFloatParameters<T extends object>(
    storeParameters: Partial<T>,
    defaultParameters: T,
  ): Record<string, number> {
    const scheme = defaultParameters;
    const floatParameters: Record<string, number> = {};
    for (const [_key, value] of Object.entries(storeParameters)) {
      const key = _key as keyof T;
      if (scheme[key] !== undefined) {
        const isBoolean = typeof scheme[key] === "boolean";
        floatParameters[key as string] = isBoolean
          ? value
            ? 1
            : 0
          : (value as number);
      }
    }
    return floatParameters;
  },
  mapFloatParametersToStoreParameters<T extends object>(
    rawParameters: Record<string, number>,
    defaultParameters: T,
  ): Partial<T> {
    const scheme = defaultParameters;
    const storeParameters: Partial<T> = {};
    for (const [_key, value] of Object.entries(rawParameters)) {
      const key = _key as keyof T;
      if (scheme[key] !== undefined) {
        if (typeof scheme[key] === "boolean") {
          (storeParameters[key] as boolean) = value >= 0.5;
        } else {
          (storeParameters[key] as number) = value;
        }
      }
    }
    return storeParameters;
  },
};
