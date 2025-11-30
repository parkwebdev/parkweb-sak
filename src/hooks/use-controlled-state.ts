import * as React from 'react';

type UseControlledStateProps<T> = {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
};

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
