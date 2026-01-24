/**
 * @fileoverview Context provider for global pricing modal state.
 * Allows opening the pricing modal from anywhere in the app.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PricingModalContextType {
  isOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;
}

const PricingModalContext = createContext<PricingModalContextType | null>(null);

interface PricingModalProviderProps {
  children: ReactNode;
}

export function PricingModalProvider({ children }: PricingModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openPricingModal = useCallback(() => setIsOpen(true), []);
  const closePricingModal = useCallback(() => setIsOpen(false), []);

  return (
    <PricingModalContext.Provider value={{ isOpen, openPricingModal, closePricingModal }}>
      {children}
    </PricingModalContext.Provider>
  );
}

export function usePricingModal() {
  const context = useContext(PricingModalContext);
  if (!context) {
    throw new Error('usePricingModal must be used within a PricingModalProvider');
  }
  return context;
}
