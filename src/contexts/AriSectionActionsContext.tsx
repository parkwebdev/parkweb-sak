/**
 * AriSectionActionsContext
 * 
 * Context for Ari sections to register their action buttons,
 * which are then rendered in the TopBar's right section.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface SectionAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
  icon?: ReactNode;
  disabled?: boolean;
  /** For toggle buttons like Debug Mode */
  isActive?: boolean;
  /** Show only if user has permission */
  requiresPermission?: boolean;
}

interface AriSectionActionsContextValue {
  actions: SectionAction[];
  registerActions: (sectionId: string, actions: SectionAction[]) => void;
  unregisterActions: (sectionId: string) => void;
  currentSection: string | null;
  setCurrentSection: (sectionId: string | null) => void;
}

const AriSectionActionsContext = createContext<AriSectionActionsContextValue | null>(null);

interface AriSectionActionsProviderProps {
  children: ReactNode;
}

export function AriSectionActionsProvider({ children }: AriSectionActionsProviderProps) {
  const [actionsBySection, setActionsBySection] = useState<Record<string, SectionAction[]>>({});
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  const registerActions = useCallback((sectionId: string, actions: SectionAction[]) => {
    setActionsBySection(prev => ({ ...prev, [sectionId]: actions }));
  }, []);

  const unregisterActions = useCallback((sectionId: string) => {
    setActionsBySection(prev => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  }, []);

  const actions = currentSection ? actionsBySection[currentSection] || [] : [];

  return (
    <AriSectionActionsContext.Provider
      value={{
        actions,
        registerActions,
        unregisterActions,
        currentSection,
        setCurrentSection,
      }}
    >
      {children}
    </AriSectionActionsContext.Provider>
  );
}

export function useAriSectionActions() {
  const context = useContext(AriSectionActionsContext);
  if (!context) {
    throw new Error('useAriSectionActions must be used within AriSectionActionsProvider');
  }
  return context;
}

/**
 * Hook for sections to register their actions.
 * Actions are automatically unregistered when the component unmounts.
 * Uses stable function references to avoid re-render loops.
 */
export function useRegisterSectionActions(sectionId: string, actions: SectionAction[]) {
  const { registerActions, unregisterActions } = useAriSectionActions();
  
  // Serialize actions to detect meaningful changes
  const actionsKey = JSON.stringify(
    actions.map(a => ({ id: a.id, label: a.label, disabled: a.disabled, isActive: a.isActive }))
  );
  
  useEffect(() => {
    registerActions(sectionId, actions);
    return () => unregisterActions(sectionId);
  }, [sectionId, actionsKey, registerActions, unregisterActions]);
}
