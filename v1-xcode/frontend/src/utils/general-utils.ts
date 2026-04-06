export function filterObjectMembers<T extends object, K extends keyof T>(
  obj: T,
  referenceObject: T,
): Partial<Pick<T, K>> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key]) => referenceObject[key as K] !== undefined,
    ),
  ) as Partial<Pick<T, K>>;
}
