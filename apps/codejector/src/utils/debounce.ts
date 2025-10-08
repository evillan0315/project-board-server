/**
 * Debounces a function, returning a new function that will only be called after
 * a specified delay from its last invocation. It also provides a `cancel` method
 * to immediately cancel any pending debounced calls.
 * @param func The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns A debounced function with a `cancel` method.
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };

  // Add a cancel method to the debounced function
  (debounced as T & { cancel: () => void }).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as T & { cancel: () => void };
};
