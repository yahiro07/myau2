export type SelectorOption<T extends string | number> = {
  label: string;
  value: T;
};

export function createEnumOptions<T extends number>(
  source: [T, string][],
): SelectorOption<T>[] {
  return source.map(([value, label]) => ({ label, value }));
}
