/**
 * Authentication Context Provider
 * 
 * Manages user authentication state throughout the application.
 * Handles Supabase auth events, session management, and profile creation.
 * 
 * @module contexts/AuthContext
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Shape of the authentication context value
 */
interface AuthContextType {
  /** Currently authenticated user or null */
  user: User | null;
  /** Current auth session or null */
  session: Session | null;
  /** Whether auth state is being determined */
  loading: boolean;
  /** Flag indicating user just completed sign-in (for loading screen) */
  justSignedIn: boolean;
  /** Clear the justSignedIn flag after loading animation */
  clearJustSignedIn: () => void;
  /** Flag indicating user has seen the Ari loader this session */
  hasSeenAriLoader: boolean;
  /** Set the Ari loader seen flag */
  setHasSeenAriLoader: (value: boolean) => void;
  /** Sign out the current user */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 * 
 * @throws Error if used outside AuthProvider
 * @returns Authentication context value
 * 
 * @example
 * const { user, signOut } = useAuth();
 * if (user) {
 *   console.log('Logged in as:', user.email);
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component.
 * Wraps the application to provide auth state and methods.
 * 
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenAriLoader, setHasSeenAriLoader] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  
  // Use refs to avoid re-creating subscription and track state without triggering re-renders
  const initialCheckCompleteRef = useRef(false);
  const previousUserRef = useRef<User | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only set justSignedIn for ACTUAL fresh logins:
        // - Initial check must be complete (not session restoration)
        // - Must be a SIGNED_IN event
        // - Must be transitioning from no user to having a user (not token refresh)
        if (
          session?.user && 
          event === 'SIGNED_IN' && 
          initialCheckCompleteRef.current &&
          !previousUserRef.current
        ) {
          setJustSignedIn(true);
        }

        // Track previous user for detecting actual login transitions
        previousUserRef.current = session?.user ?? null;

        // Handle profile creation/updates and signup completion after successful authentication
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(async () => {
            await createOrUpdateProfile(session.user);
            // Process signup completion (handles invitations, welcome notification, agent creation)
            await processSignupCompletion(session);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check if this was a temporary session (Remember Me unchecked)
      // If browser was closed and reopened, sessionStorage would be cleared
      // but localStorage session would remain - we should sign out
      const wasTemporarySession = sessionStorage.getItem('pilot_session_temporary') === null && 
                                   localStorage.getItem('pilot_session_temporary_flag') === 'true';
      
      if (session && wasTemporarySession) {
        // User didn't want to be remembered, sign them out
        localStorage.removeItem('pilot_session_temporary_flag');
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        initialCheckCompleteRef.current = true;
        return;
      }
      
      // Sync the flag to localStorage so we can detect browser restart
      if (sessionStorage.getItem('pilot_session_temporary') === 'true') {
        localStorage.setItem('pilot_session_temporary_flag', 'true');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      previousUserRef.current = session?.user ?? null;
      setLoading(false);
      initialCheckCompleteRef.current = true;
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Create or update user profile after authentication.
   * Also creates default notification preferences if missing.
   * @internal
   */
  const createOrUpdateProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          });

        if (error) {
          logger.error('Error creating profile:', error);
        }
      }

      // Check if notification preferences exist
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingPrefs) {
        // Create default notification preferences
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            email_notifications: true,
            browser_notifications: true,
          });

        if (error) {
          logger.error('Error creating notification preferences:', error);
        }
      }
    } catch (error: unknown) {
      logger.error('Error in createOrUpdateProfile:', error);
    }
  };

  /**
   * Process signup completion by calling the handle-signup edge function.
   * This handles team invitations, welcome notifications, and agent creation.
   * Only runs once per user (checks if already processed).
   * @internal
   */
  const processSignupCompletion = async (session: Session) => {
    try {
      // Check if this user was already processed (has an agent or is a team member)
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const { data: existingTeamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('member_id', session.user.id)
        .maybeSingle();

      // If user already has an agent or is a team member, skip signup processing
      if (existingAgent || existingTeamMember) {
        return;
      }

      // Call the handle-signup edge function
      const { error } = await supabase.functions.invoke('handle-signup', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        logger.error('Error processing signup completion:', error);
      }
    } catch (error: unknown) {
      logger.error('Error in processSignupCompletion:', error);
    }
  };

  /**
   * Sign out the current user.
   * Clears session persistence flags.
   * @throws Error if sign out fails
   */
  const signOut = async () => {
    // Clear session persistence flags
    sessionStorage.removeItem('pilot_session_temporary');
    localStorage.removeItem('pilot_session_temporary_flag');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  };

  /** Clear the justSignedIn flag after loading animation completes */
  const clearJustSignedIn = () => setJustSignedIn(false);

  const value = {
    user,
    session,
    loading,
    justSignedIn,
    clearJustSignedIn,
    hasSeenAriLoader,
    setHasSeenAriLoader,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};