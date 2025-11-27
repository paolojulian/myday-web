import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type UseQueryParamStateReturn<T> = [
  T,
  (value: T) => void,
  () => void
];

/**
 * A hook that syncs state with URL query parameters.
 *
 * @param key - The query parameter key
 * @param defaultValue - The default value when the query parameter is not present
 * @returns A tuple containing [value, setValue, removeValue]
 *
 * @example
 * const [isOpen, setIsOpen, removeIsOpen] = useQueryParamState('modal', false);
 */
export function useQueryParamState<T = string>(
  key: string,
  defaultValue: T
): UseQueryParamStateReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = (() => {
    const paramValue = searchParams.get(key);

    if (paramValue === null) {
      return defaultValue;
    }

    // Handle boolean values
    if (typeof defaultValue === 'boolean') {
      return (paramValue === 'true') as T;
    }

    // Handle number values
    if (typeof defaultValue === 'number') {
      return Number(paramValue) as T;
    }

    // Return string value
    return paramValue as T;
  })();

  const setValue = useCallback((newValue: T) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(key, String(newValue));
      return next;
    });
  }, [key, setSearchParams]);

  const removeValue = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(key);
      return next;
    });
  }, [key, setSearchParams]);

  return [value, setValue, removeValue];
}
