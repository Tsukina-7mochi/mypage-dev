export type ObjectEntries<T> = {
  [K in keyof T]: [K extends string | number ? `${K}` : never, T[K]];
}[keyof T][];
