import * as React from 'react';

/**
 * Props for the useControlledState hook.
 * @template T - The type of the state value
 */
type UseControlledStateProps<T> = {
  /** The controlled value (if provided, component is controlled) */
  value?: T;
  /** The default value for uncontrolled mode */
  defaultValue?: T;
  /** Callback fired when the value changes */
  onChange?: (value: T) => void;
};

/**
 * Custom hook for managing controlled/uncontrolled component state.
 * Supports both controlled mode (value prop provided) and uncontrolled mode (defaultValue only).
 * Automatically syncs internal state with external value in controlled mode.
 * 
 * @template T - The type of the state value
 * @param props - Configuration options including value, defaultValue, and onChange
 * @returns A tuple of [currentValue, setValue] similar to useState
 * 
 * @example
 * ```tsx
 * // Uncontrolled usage
 * const [value, setValue] = useControlledState({ defaultValue: 'hello' });
 * 
 * // Controlled usage
 * const [value, setValue] = useControlledState({ 
 *   value: externalValue, 
 *   onChange: setExternalValue 
 * });
 * ```
 */
export function useControlledState<T>({
  value,
  defaultValue,
  onChange,
}: UseControlledStateProps<T>): [T | undefined, (value: T) => void] {
  const [internalValue, setInternalValue] = React.useState<T | undefined>(
    value ?? defaultValue
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (newValue: T) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange]
  );

  React.useEffect(() => {
    if (isControlled) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  return [currentValue, setValue];
}
