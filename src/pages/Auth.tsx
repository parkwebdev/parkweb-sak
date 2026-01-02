import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FormHint } from '@/components/ui/form-hint';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FeaturedIcon } from '@/components/ui/featured-icon';
import { StepProgress, type StepItem } from '@/components/ui/step-progress';
import { PaginationDots } from '@/components/ui/pagination-dots';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength } from '@/utils/input-validation';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { Eye, EyeOff, User01, Key01, UsersPlus, CheckCircle, Mail01, ArrowLeft } from '@untitledui/icons';
import { EmailTagInput } from '@/components/ui/email-tag-input';
import { AnimatePresence, motion } from 'motion/react';
import PilotLogo from '@/components/PilotLogo';
import { AuthTurnstile, AuthTurnstileRef } from '@/components/AuthTurnstile';


const signupSteps: StepItem[] = [
  {
    title: "Your details",
    description: "Please provide your name and email",
    icon: User01,
  },
  {
    title: "Choose a password",
    description: "Choose a secure password",
    icon: Key01,
  },
  {
    title: "Invite your team",
    description: "Start collaborating with your team",
    icon: UsersPlus,
  },
  {
    title: "Complete setup",
    description: "You're all set to get started",
    icon: CheckCircle,
  },
];

// Simplified steps for invited team members (no invite team step)
const invitedUserSteps: StepItem[] = [
  {
    title: "Your details",
    description: "Complete your profile",
    icon: User01,
  },
  {
    title: "Choose a password",
    description: "Secure your account",
    icon: Key01,
  },
  {
    title: "Complete setup",
    description: "You're all set to get started",
    icon: CheckCircle,
  },
];

const stepIcons = [User01, Key01, UsersPlus, CheckCircle];
const invitedStepIcons = [User01, Key01, CheckCircle];

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [currentStep, setCurrentStep] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // New state for password reset flow
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Track if user is coming from a team invitation
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  
  const navigate = useNavigate();
  const { logAuthEvent } = useSecurityLog();
  
  // Turnstile CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<AuthTurnstileRef>(null);
  
  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  }, []);
  
  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);
  
  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    toast.error("Verification failed", { description: "Please try again" });
  }, []);
  
  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    
    checkUser();

    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const firstNameParam = urlParams.get('firstName');
    const lastNameParam = urlParams.get('lastName');
    const tabParam = urlParams.get('tab');
    const typeParam = urlParams.get('type');
    const hashFragment = window.location.hash;
    
    if (emailParam) {
      setEmail(emailParam);
      // If coming from invitation link, mark as invited user
      setIsInvitedUser(true);
    }
    
    // Pre-fill name fields from URL params (for invited users)
    if (firstNameParam) {
      setFirstName(firstNameParam);
    }
    if (lastNameParam) {
      setLastName(lastNameParam);
    }
    
    if (tabParam === 'signup') {
      setActiveTab('signup');
    }
    
    // Handle password reset callback (tab=reset)
    if (tabParam === 'reset') {
      setShowResetPassword(true);
      setActiveTab('signin');
    }
    
    // Handle email verification callback
    if (typeParam === 'signup' || hashFragment.includes('access_token')) {
      toast.success("Email verified!", { 
        description: "Your account is now active. Please sign in." 
      });
    }

    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
        setShowForgotPassword(false);
      }
      
      // If user is now signed in after PASSWORD_RECOVERY and password update
      if (event === 'SIGNED_IN' && session && showResetPassword) {
        // Password was successfully reset and user is now logged in
        toast.success("Password updated!", { 
          description: "You're now signed in with your new password." 
        });
        setShowResetPassword(false);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, showResetPassword]);

  // Reset captcha only when switching between sign-in/sign-up or forgot password
  useEffect(() => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  }, [activeTab, showForgotPassword]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        logAuthEvent('login', false, { error: error.message, provider: 'google' });
        toast.error("Google sign in failed", { description: error.message });
      }
    } catch (error: unknown) {
      toast.error("Error", { description: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'email profile openid',
        }
      });

      if (error) {
        logAuthEvent('login', false, { error: error.message, provider: 'azure' });
        toast.error("Microsoft sign in failed", { description: error.message });
      }
    } catch (error: unknown) {
      toast.error("Error", { description: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Error", { description: "Please fill in all fields" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: { captchaToken: captchaToken || undefined }
      });

      if (error) {
        resetCaptcha();
        logAuthEvent('login', false, { error: error.message });
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid credentials", { description: "Please check your email and password and try again." });
        } else if (error.message.includes('Email not confirmed')) {
          toast.error("Email not confirmed", { description: "Please check your email and click the confirmation link." });
        } else {
          toast.error("Sign in failed", { description: error.message });
        }
        return;
      }

      logAuthEvent('login', true);
      navigate('/');
    } catch (error: unknown) {
      toast.error("Error", { description: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!firstName.trim() || !email) {
        toast.error("Error", { description: "Please fill in all required fields" });
        return;
      }
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Error", { description: "Please enter a valid email address" });
        return;
      }
    }

    if (currentStep === 1) {
      if (!password || !confirmPassword) {
        toast.error("Error", { description: "Please fill in all fields" });
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Error", { description: "Passwords do not match" });
        return;
      }
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        toast.error("Password too weak", { description: passwordValidation.errors[0] });
        return;
      }
    }

    // For invited users: step 1 (password) triggers signup directly
    if (isInvitedUser) {
      if (currentStep < 2) {
        if (currentStep === 1) {
          // For invited users, verify captcha before signup
          if (!captchaToken) {
            toast.error("Verification required", { description: "Please complete the security check" });
            return;
          }
          // Trigger signup for invited user, then move to completion
          handleSignUp();
        } else {
          setCurrentStep(currentStep + 1);
        }
      }
    } else {
      // Regular signup flow with invite team step
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }

      // If moving to step 3 (Complete), trigger signup
      if (currentStep === 2) {
        if (!captchaToken) {
          toast.error("Verification required", { description: "Please complete the security check on the password step" });
          return;
        }
        handleSignUp();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Build display name from first and last name
      const displayName = `${firstName.trim()}${lastName.trim() ? ' ' + lastName.trim() : ''}`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          captchaToken: captchaToken || undefined,
          data: { 
            display_name: displayName,
            first_name: firstName.trim(),
            last_name: lastName.trim() || null
          }
        }
      });

      if (error) {
        resetCaptcha();
        logAuthEvent('signup', false, { error: error.message });
        if (error.message.includes('User already registered')) {
          toast.error("Account exists", { description: "An account with this email already exists. Please sign in instead." });
          setActiveTab('signin');
          setCurrentStep(0);
        } else {
          toast.error("Sign up failed", { description: error.message });
        }
        return;
      }

      logAuthEvent('signup', true);

      // Note: handle-signup is called automatically by AuthContext on SIGNED_IN event
      // This happens after the user confirms their email and signs in

      // Move to completion step
      if (isInvitedUser) {
        setCurrentStep(2); // Completion is step 2 for invited users
      } else {
        setCurrentStep(3); // Completion is step 3 for regular users
      }
    } catch (error: unknown) {
      toast.error("Error", { description: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    toast.success("Account created!", { description: "Please check your email to confirm your account." });
    setActiveTab('signin');
    setCurrentStep(0);
    setPassword('');
    setConfirmPassword('');
    setTeamEmails([]);
    // Don't clear firstName/lastName/email in case user needs to sign in
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Error", { description: "Please enter your email address" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?tab=reset`,
        captchaToken: captchaToken || undefined,
      });

      if (error) {
        toast.error("Reset failed", { description: error.message });
        return;
      }

      toast.success("Check your email", { 
        description: "We've sent you a password reset link" 
      });
      resetCaptcha();
      setShowForgotPassword(false);
    } catch (error: unknown) {
      resetCaptcha();
      toast.error("Error", { description: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  // New handler for setting new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmNewPassword) {
      toast.error("Error", { description: "Please fill in all fields" });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast.error("Error", { description: "Passwords do not match" });
      return;
    }
    
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      toast.error("Password too weak", { description: passwordValidation.errors[0] });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        toast.error("Failed to update password", { description: error.message });
        return;
      }
      
      toast.success("Password updated!", { 
        description: "You can now sign in with your new password" 
      });
      
      // Clear the reset state and password fields
      setShowResetPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Clear the URL parameter
      window.history.replaceState({}, document.title, '/auth');
      
      // Navigate to home (user should now be logged in)
      navigate('/');
    } catch (error: unknown) {
      toast.error("Error", { description: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepIcon = activeTab === 'signup' ? stepIcons[currentStep] : Key01;

  const renderSignupStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-6"
          >
            <h1 className="sr-only">Authentication</h1>

            <div className="z-10 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">First name <span className="text-destructive">*</span></Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10"
                    disabled={isLoading || isInvitedUser}
                    readOnly={isInvitedUser}
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastname">Last name</Label>
                  <Input
                    id="signup-lastname"
                    type="text"
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10"
                    disabled={isLoading || isInvitedUser}
                    readOnly={isInvitedUser}
                    autoComplete="family-name"
                  />
                </div>
              </div>
              {isInvitedUser && (
                <FormHint>Your name was provided in your invitation</FormHint>
              )}
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                  disabled={isLoading || isInvitedUser}
                  readOnly={isInvitedUser}
                  autoComplete="email"
                />
                {isInvitedUser && (
                  <FormHint>This email was provided in your invitation</FormHint>
                )}
              </div>
              <Button onClick={handleNextStep} size="lg" className="w-full" disabled={isLoading}>
                Continue
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                className="w-full" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                className="w-full" 
                onClick={handleMicrosoftSignIn}
                disabled={isLoading}
              >
                <svg className="size-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Sign up with Microsoft
              </Button>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-6"
          >

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pr-10"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </Button>
                </div>
                {password && <PasswordStrengthIndicator password={password} className="mt-2" />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm password</Label>
                <Input
                  id="signup-confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              
              <AuthTurnstile
                ref={turnstileRef}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
              />
              
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={handlePrevStep}>
                  <ArrowLeft />
                </Button>
                <Button onClick={handleNextStep} size="lg" className="flex-1" disabled={isLoading}>
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        // For invited users, step 2 is the completion step
        if (isInvitedUser) {
          return (
            <motion.div
              key="step-2-complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-6"
            >
              <div className="flex flex-col items-center gap-6 text-center">
                <FeaturedIcon color="success" theme="modern" size="xl">
                  <CheckCircle />
                </FeaturedIcon>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-foreground">You're all set!</h2>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation email to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please check your inbox and click the confirmation link to activate your account.
                  </p>
                </div>
                <Button onClick={handleCompleteSetup} size="lg" className="w-full">
                  Go to Sign In
                </Button>
              </div>
            </motion.div>
          );
        }
        
        // For regular users, step 2 is the invite team step
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-6"
          >

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="team-emails">Team email addresses (optional)</Label>
                <EmailTagInput
                  value={teamEmails}
                  onChange={setTeamEmails}
                  placeholder="Enter an email address"
                  disabled={isLoading}
                />
                <FormHint>Press Enter or click + to add each email</FormHint>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={handlePrevStep}>
                  <ArrowLeft />
                </Button>
                <Button onClick={handleNextStep} size="lg" className="flex-1" loading={isLoading}>
                  {teamEmails.length > 0 ? 'Send invites & continue' : 'Skip for now'}
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        // Only for regular users (invited users complete at step 2)
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full space-y-6"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <FeaturedIcon color="success" theme="modern" size="xl">
                <CheckCircle />
              </FeaturedIcon>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold text-foreground">You're all set!</h2>
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation email to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Please check your inbox and click the confirmation link to activate your account.
                </p>
              </div>
              <Button onClick={handleCompleteSetup} size="lg" className="w-full">
                Go to Sign In
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Render reset password form
  const renderResetPasswordForm = () => (
    <motion.div
      key="reset-password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full space-y-6"
    >

      <form onSubmit={handleSetNewPassword} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className="h-10 pr-10"
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </Button>
          </div>
          {newPassword && <PasswordStrengthIndicator password={newPassword} className="mt-2" />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Confirm new password</Label>
          <Input
            id="confirm-new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            disabled={isLoading}
            className="h-10"
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Reset password
        </Button>

        <Button 
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowResetPassword(false);
            setNewPassword('');
            setConfirmNewPassword('');
            window.history.replaceState({}, document.title, '/auth');
          }}
          className="mx-auto"
        >
          <ArrowLeft />
          Back to sign in
        </Button>
      </form>
    </motion.div>
  );

  return (
    <section className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[400px_1fr]">
      {/* Left Sidebar - Progress (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-muted/50 border-r border-border">
        <div className="flex flex-col gap-12 px-8 pt-8">
          {/* Logo with text */}
          <div className="flex items-center">
            <PilotLogo className="h-8 w-8 text-foreground" />
          </div>
          
          {/* Step Progress (only for signup) */}
          {activeTab === 'signup' && !showResetPassword && (
            <StepProgress 
              steps={isInvitedUser ? invitedUserSteps : signupSteps} 
              currentStep={currentStep} 
              className="pr-4" 
            />
          )}

          {/* Sign in sidebar content */}
          {activeTab === 'signin' && !showResetPassword && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to continue where you left off.
              </p>
            </div>
          )}

          {/* Reset password sidebar content */}
          {showResetPassword && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Reset password</h2>
              <p className="text-sm text-muted-foreground">
                Create a new secure password for your account.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center px-8 py-6 text-sm text-muted-foreground">
          <p>© Pilot 2025</p>
          <a href="mailto:help@getpilot.io" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Mail01 className="w-4 h-4" />
            help@getpilot.io
          </a>
        </footer>
      </div>

      {/* Right Content Area */}
      <div className="flex min-h-screen w-full flex-1 overflow-auto py-8 md:py-12">
        <div className="mx-auto flex h-full w-full flex-col items-center px-4 md:px-8">
          {/* Mobile Logo with text */}
          <div className="lg:hidden flex items-center mb-8">
            <PilotLogo className="h-8 w-8 text-foreground" />
          </div>

          <div className="flex w-full max-w-md flex-col flex-1">
            <div className="flex w-full flex-1 items-center justify-center">
              <AnimatePresence mode="wait">
                {showResetPassword ? (
                  renderResetPasswordForm()
                ) : showForgotPassword ? (
                  <motion.div
                    key="forgot-password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full space-y-6"
                  >

                    <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="h-10"
                          autoComplete="email"
                        />
                      </div>

                      <AuthTurnstile
                        ref={turnstileRef}
                        onVerify={handleCaptchaVerify}
                        onError={handleCaptchaError}
                        onExpire={handleCaptchaExpire}
                      />

                      <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                        Send reset link
                      </Button>

                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowForgotPassword(false)}
                        className="mx-auto"
                      >
                        <ArrowLeft />
                        Back to sign in
                      </Button>
                    </form>
                  </motion.div>
                ) : activeTab === 'signin' ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-full space-y-6"
                  >

                    <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="h-10"
                          autoComplete="email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-10 pr-10"
                            disabled={isLoading}
                            autoComplete="current-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7"
                            disabled={isLoading}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                          >
                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember" />
                          <Label htmlFor="remember" className="text-sm text-muted-foreground font-normal">
                            Remember for 30 days
                          </Label>
                        </div>
                        <Button 
                          type="button" 
                          variant="link"
                          size="sm"
                          onClick={() => setShowForgotPassword(true)}
                          className="h-auto p-0"
                        >
                          Forgot password
                        </Button>
                      </div>

                      <AuthTurnstile
                        ref={turnstileRef}
                        onVerify={handleCaptchaVerify}
                        onError={handleCaptchaError}
                        onExpire={handleCaptchaExpire}
                      />

                      <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                        Sign in
                      </Button>

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        className="w-full" 
                        disabled={isLoading}
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="size-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </Button>

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        className="w-full" 
                        disabled={isLoading}
                        onClick={handleMicrosoftSignIn}
                      >
                        <svg className="size-5" viewBox="0 0 21 21">
                          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                        </svg>
                        Sign in with Microsoft
                      </Button>
                    </form>

                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Don't have an account? </span>
                      <Button 
                        variant="link"
                        size="sm"
                        onClick={() => { setActiveTab('signup'); setCurrentStep(0); }}
                        className="h-auto p-0 font-medium"
                      >
                        Sign up
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  renderSignupStepContent()
                )}
              </AnimatePresence>
            </div>

            {/* Pagination Dots (signup only) */}
            {activeTab === 'signup' && !showResetPassword && (
              <div className="flex justify-center pb-2">
                <PaginationDots total={4} current={currentStep} size="md" />
              </div>
            )}

            {/* Back to Sign In (signup only, except completion) */}
            {activeTab === 'signup' && currentStep < 3 && !showResetPassword && (
              <div className="text-center pb-2">
                <span className="text-sm text-muted-foreground">Already have an account? </span>
                <Button 
                  variant="link"
                  size="sm"
                  onClick={() => { setActiveTab('signin'); setCurrentStep(0); }}
                  className="h-auto p-0 font-medium"
                >
                  Sign in
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Auth;
