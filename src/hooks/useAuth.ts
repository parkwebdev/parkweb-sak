import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength, validateAndSanitizeEmail } from '@/utils/input-validation';

/**
 * Hook for authentication with input validation.
 * Wraps AuthContext and adds email sanitization and password strength validation.
 * 
 * @returns {Object} Auth context plus validated sign-in/sign-up methods
 * @returns {User|null} user - Current authenticated user
 * @returns {boolean} loading - Auth loading state
 * @returns {Function} signUpWithValidation - Sign up with email/password validation
 * @returns {Function} signInWithValidation - Sign in with email sanitization
 * @returns {Function} signOut - Sign out current user
 */
export const useAuth = () => {
  const context = useAuthContext();

  const signUpWithValidation = async (email: string, password: string) => {
    // Validate and sanitize email
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error || 'Invalid email');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Proceed with signup using sanitized data
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: emailValidation.sanitized,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      throw error;
    }

    return { success: true };
  };

  const signInWithValidation = async (email: string, password: string) => {
    // Validate and sanitize email
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error || 'Invalid email');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailValidation.sanitized,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  };

  return {
    ...context,
    signUpWithValidation,
    signInWithValidation,
  };
};