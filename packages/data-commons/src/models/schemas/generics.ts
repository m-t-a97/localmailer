import { SafeParseReturnType, ZodError, ZodSchema } from 'zod';

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

export const isValid = <T>(
  _: unknown,
  parseResult: SafeParseReturnType<unknown, T>,
): _ is T => parseResult.success;

export const getValidationResult = <T>(
  input: unknown,
  schema: ZodSchema,
): ValidationResult<T> => {
  const parseResult = schema.safeParse(input);

  if (isValid<T>(input, parseResult)) {
    return { success: true, value: input };
  } else if (parseResult.success === false) {
    return {
      success: false,
      error: getValidationErrorMessage(parseResult.error),
    } as any;
  }

  return { success: false, error: "Unknown error with the input" };
};

export const getValidationErrorMessage = (error: ZodError<any>): string => {
  return error.errors
    .map((issue) => `${issue.message}: ${issue.path.pop()}`)
    .join(", ");
};

export const getKeyFromType = <T>(name: keyof T) => name;
