/**
 * Strict Context Factory
 * 
 * Creates type-safe React contexts that throw helpful errors when used
 * outside their provider. Eliminates undefined checks in consuming components.
 * 
 * @module lib/get-strict-context
 */

import * as React from 'react';

/**
 * Creates a strictly-typed React context with built-in provider and hook.
 * Unlike standard React contexts, this throws an error if used outside the provider,
 * ensuring type safety and better developer experience.
 * 
 * @template T - The type of the context value
 * @param contextName - Name used in error messages (e.g., "Auth" produces "useAuth must be used within AuthProvider")
 * @returns Tuple of [Provider component, useContext hook]
 * 
 * @example
 * // Create a typed context
 * interface AuthContextValue {
 *   user: User | null;
 *   login: (email: string) => Promise<void>;
 * }
 * 
 * const [AuthProvider, useAuth] = getStrictContext<AuthContextValue>('Auth');
 * 
 * // Use in provider
 * function App() {
 *   return (
 *     <AuthProvider value={{ user, login }}>
 *       <MyComponent />
 *     </AuthProvider>
 *   );
 * }
 * 
 * // Use in consumer (no undefined checks needed!)
 * function MyComponent() {
 *   const { user, login } = useAuth(); // Guaranteed to be defined
 *   return <div>{user.name}</div>;
 * }
 * 
 * @remarks
 * This pattern is preferred over standard createContext for contexts that
 * should always be provided. It catches missing providers at runtime with
 * clear error messages rather than returning undefined values.
 */
export function getStrictContext<T>(contextName: string) {
  const Context = React.createContext<T | undefined>(undefined);

  /**
   * Provider component that wraps children with context value
   */
  const Provider = ({ value, children }: { value: T; children: React.ReactNode }) => {
    return React.createElement(Context.Provider, { value }, children);
  };

  /**
   * Hook to consume the context value
   * @throws Error if used outside the Provider
   */
  function useContext() {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error(`use${contextName} must be used within a ${contextName}Provider`);
    }
    return context;
  }

  return [Provider, useContext] as const;
}
