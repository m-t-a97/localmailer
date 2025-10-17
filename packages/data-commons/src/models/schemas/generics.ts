import { ZodError, ZodType } from 'zod';
import { fromError } from 'zod-validation-error';

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ZodError };

export const isValid = <T>(
  _: unknown,
  parseResult: SafeParseResult<T>
): _ is T => parseResult.success;

export const getValidationResult = <T>(
  input: unknown,
  schema: ZodType<T>
): ValidationResult<T> => {
  const parseResult = schema.safeParse(input);

  if (parseResult.success) {
    return { success: true, value: parseResult.data };
  } else {
    return {
      success: false,
      error: fromError(parseResult.error).toString(),
    };
  }
};

export const getKeyFromType = <T>(name: keyof T) => name;
