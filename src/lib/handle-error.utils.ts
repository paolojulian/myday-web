export function handleError(
  error: unknown,
  fallbackError?: string | Error,
): Error {
  if (error instanceof Error) {
    return error;
  }

  if (fallbackError instanceof Error) {
    return fallbackError;
  }

  return new Error(fallbackError || "Something went wrong.");
}
