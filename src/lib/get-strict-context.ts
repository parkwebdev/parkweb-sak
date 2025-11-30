import * as React from 'react';

export function getStrictContext<T>(contextName: string) {
  const Context = React.createContext<T | undefined>(undefined);

  const Provider = ({ value, children }: { value: T; children: React.ReactNode }) => {
    return React.createElement(Context.Provider, { value }, children);
  };

  function useContext() {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error(`use${contextName} must be used within a ${contextName}Provider`);
    }
    return context;
  }

  return [Provider, useContext] as const;
}
