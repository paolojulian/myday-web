export function handleError(
  error: unknown,
  fallbackError?: string | Error,
): Error {
  if (error instanceof Error) {
    console.error(error);
    return error;
  }

  if (fallbackError instanceof Error) {
    console.error(fallbackError);
    return fallbackError;
  }

  console.error(fallbackError);
  return new Error(fallbackError || "Something went wrong.");
}
