/**
 * Settings Section Actions Context
 * 
 * Allows settings section components to register their TopBar actions
 * dynamically based on the active tab. Similar pattern to AriSectionActionsContext.
 * 
 * @module contexts/SettingsSectionActionsContext
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';

export interface SettingsSectionAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
}

interface SettingsSectionActionsContextValue {
  actions: SettingsSectionAction[];
  registerActions: (sectionId: string, actions: SettingsSectionAction[]) => void;
  unregisterActions: (sectionId: string) => void;
  currentSection: string | null;
  setCurrentSection: (sectionId: string | null) => void;
}

const SettingsSectionActionsContext = createContext<SettingsSectionActionsContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
}

export function SettingsSectionActionsProvider({ children }: ProviderProps) {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [actionRegistry, setActionRegistry] = useState<Record<string, SettingsSectionAction[]>>({});

  const registerActions = useCallback((sectionId: string, actions: SettingsSectionAction[]) => {
    setActionRegistry(prev => ({ ...prev, [sectionId]: actions }));
  }, []);

  const unregisterActions = useCallback((sectionId: string) => {
    setActionRegistry(prev => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  }, []);

  const actions = useMemo(() => {
    if (!currentSection) return [];
    return actionRegistry[currentSection] || [];
  }, [currentSection, actionRegistry]);

  const value = useMemo(() => ({
    actions,
    registerActions,
    unregisterActions,
    currentSection,
    setCurrentSection,
  }), [actions, registerActions, unregisterActions, currentSection, setCurrentSection]);

  return (
    <SettingsSectionActionsContext.Provider value={value}>
      {children}
    </SettingsSectionActionsContext.Provider>
  );
}

export function useSettingsSectionActions() {
  const context = useContext(SettingsSectionActionsContext);
  if (!context) {
    throw new Error('useSettingsSectionActions must be used within SettingsSectionActionsProvider');
  }
  return context;
}

/**
 * Hook for section components to register their TopBar actions
 */
export function useRegisterSettingsActions(sectionId: string, actions: SettingsSectionAction[]) {
  const { registerActions, unregisterActions } = useSettingsSectionActions();

  useEffect(() => {
    registerActions(sectionId, actions);
    return () => unregisterActions(sectionId);
  }, [sectionId, actions, registerActions, unregisterActions]);
}
