/**
 * Utility type to convert camelCase to snake_case
 */
type ApplySnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${ApplySnakeCase<U>}`
  : S;

/**
 * Utility map type to apply the SnakeCase transformation to the keys of a type
 */
export type SnakeCase<T> = {
  [K in keyof T as ApplySnakeCase<Extract<K, string>>]: T[K];
};
