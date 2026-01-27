/**
 * AriSectionActionsContext
 * 
 * Context for Ari sections to register their action buttons,
 * which are then rendered in the TopBar's right section.
 * Also supports center content slot for things like search bars.
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
  centerContent: ReactNode | null;
  registerActions: (sectionId: string, actions: SectionAction[]) => void;
  unregisterActions: (sectionId: string) => void;
  registerCenterContent: (sectionId: string, content: ReactNode) => void;
  unregisterCenterContent: (sectionId: string) => void;
  currentSection: string | null;
  setCurrentSection: (sectionId: string | null) => void;
}

const AriSectionActionsContext = createContext<AriSectionActionsContextValue | null>(null);

interface AriSectionActionsProviderProps {
  children: ReactNode;
}

export function AriSectionActionsProvider({ children }: AriSectionActionsProviderProps) {
  const [actionsBySection, setActionsBySection] = useState<Record<string, SectionAction[]>>({});
  const [centerContentBySection, setCenterContentBySection] = useState<Record<string, ReactNode>>({});
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

  const registerCenterContent = useCallback((sectionId: string, content: ReactNode) => {
    setCenterContentBySection(prev => ({ ...prev, [sectionId]: content }));
  }, []);

  const unregisterCenterContent = useCallback((sectionId: string) => {
    setCenterContentBySection(prev => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  }, []);

  const actions = currentSection ? actionsBySection[currentSection] || [] : [];
  const centerContent = currentSection ? centerContentBySection[currentSection] || null : null;

  return (
    <AriSectionActionsContext.Provider
      value={{
        actions,
        centerContent,
        registerActions,
        unregisterActions,
        registerCenterContent,
        unregisterCenterContent,
        currentSection,
        setCurrentSection,
      }}
    >
      {children}
    </AriSectionActionsContext.Provider>
  );
}

// Default context value for when hook is used outside provider (e.g., TopBar rendering before page mounts)
const defaultContextValue: AriSectionActionsContextValue = {
  actions: [],
  centerContent: null,
  registerActions: () => {},
  unregisterActions: () => {},
  registerCenterContent: () => {},
  unregisterCenterContent: () => {},
  currentSection: null,
  setCurrentSection: () => {},
};

export function useAriSectionActions() {
  const context = useContext(AriSectionActionsContext);
  // Return default value if outside provider - allows TopBar to render safely
  return context ?? defaultContextValue;
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

/**
 * Hook for sections to register center content (e.g., search bar).
 * Content is automatically unregistered when the component unmounts.
 */
export function useRegisterSectionCenterContent(sectionId: string, content: ReactNode) {
  const { registerCenterContent, unregisterCenterContent } = useAriSectionActions();
  
  useEffect(() => {
    registerCenterContent(sectionId, content);
    return () => unregisterCenterContent(sectionId);
  }, [sectionId, content, registerCenterContent, unregisterCenterContent]);
}
