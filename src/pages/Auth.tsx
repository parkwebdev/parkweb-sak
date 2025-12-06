import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FeaturedIcon } from '@/components/ui/featured-icon';
import { BackgroundPattern } from '@/components/ui/background-pattern';
import { StepProgress, type StepItem } from '@/components/ui/step-progress';
import { PaginationDots } from '@/components/ui/pagination-dots';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength } from '@/utils/input-validation';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { Eye, EyeOff, User01, Key01, UsersPlus, CheckCircle, Mail01, ArrowLeft } from '@untitledui/icons';
import { AnimatePresence, motion } from 'motion/react';

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

const stepIcons = [User01, Key01, UsersPlus, CheckCircle];

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [teamEmails, setTeamEmails] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { logAuthEvent } = useSecurityLog();

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
    const tabParam = urlParams.get('tab');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (tabParam === 'signup') {
      setActiveTab('signup');
    }
  }, [navigate]);

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
    } catch (error) {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
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
    } catch (error) {
      toast.error("Error", { description: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!displayName || !email) {
        toast.error("Error", { description: "Please fill in all fields" });
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

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }

    // If moving to step 3 (Complete), trigger signup
    if (currentStep === 2) {
      handleSignUp();
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
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { display_name: displayName }
        }
      });

      if (error) {
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

      // Handle team invitations if provided
      if (teamEmails.trim()) {
        // Process pending invitations (would be handled by edge function)
        try {
          await supabase.functions.invoke('handle-signup', {
            body: { email, user_id: 'pending' }
          });
        } catch (err) {
          console.error('Error processing signup completion:', err);
        }
      }

      // Move to completion step
      setCurrentStep(3);
    } catch (error) {
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
    setTeamEmails('');
  };

  const logoBlackUrl = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/logos/Icon%20Only%20-%20Black%20Square@2x.png';
  const logoWhiteUrl = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/logos/Icon%20Only%20-%20White%20Square@2x.png';

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
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <FeaturedIcon color="gray" theme="modern" size="xl" className="relative z-10">
                  <User01 />
                </FeaturedIcon>
                <BackgroundPattern
                  pattern="grid"
                  size="lg"
                  className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              <div className="z-10 flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-foreground">Your details</h1>
                <p className="text-sm text-muted-foreground">Please provide your name and email</p>
              </div>
            </div>

            <div className="z-10 flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              <Button onClick={handleNextStep} className="w-full h-11" disabled={isLoading}>
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
                className="w-full h-11" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
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
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <FeaturedIcon color="gray" theme="modern" size="xl" className="relative z-10">
                  <Key01 />
                </FeaturedIcon>
                <BackgroundPattern
                  pattern="grid"
                  size="lg"
                  className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              <div className="z-10 flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-foreground">Choose a password</h1>
                <p className="text-sm text-muted-foreground">Must be at least 8 characters</p>
              </div>
            </div>

            <div className="z-10 flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevStep} className="h-11 px-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button onClick={handleNextStep} className="flex-1 h-11" disabled={isLoading}>
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <FeaturedIcon color="gray" theme="modern" size="xl" className="relative z-10">
                  <UsersPlus />
                </FeaturedIcon>
                <BackgroundPattern
                  pattern="grid"
                  size="lg"
                  className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              <div className="z-10 flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-foreground">Invite your team</h1>
                <p className="text-sm text-muted-foreground">Start collaborating with your team members</p>
              </div>
            </div>

            <div className="z-10 flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="team-emails">Team email addresses (optional)</Label>
                <Input
                  id="team-emails"
                  type="text"
                  placeholder="Enter emails separated by commas"
                  value={teamEmails}
                  onChange={(e) => setTeamEmails(e.target.value)}
                  className="h-11"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  You can also invite team members later from settings
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevStep} className="h-11 px-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button onClick={handleNextStep} className="flex-1 h-11" loading={isLoading}>
                  {teamEmails.trim() ? 'Send invites & continue' : 'Skip for now'}
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <FeaturedIcon color="success" theme="modern" size="xl" className="relative z-10">
                  <CheckCircle />
                </FeaturedIcon>
                <BackgroundPattern
                  pattern="grid"
                  size="lg"
                  className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              <div className="z-10 flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-foreground">You're all set!</h1>
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation email to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
            </div>

            <div className="z-10 flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Please check your inbox and click the confirmation link to activate your account.
                </p>
              </div>
              <Button onClick={handleCompleteSetup} className="w-full h-11">
                Go to Sign In
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[400px_1fr]">
      {/* Left Sidebar - Progress (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-muted/50 border-r border-border">
        <div className="flex flex-col gap-12 px-8 pt-8">
          {/* Logo with text */}
          <div className="flex items-center gap-3">
            <img 
              src={logoBlackUrl} 
              alt="ChatPad" 
              className="h-8 w-8 object-contain dark:hidden"
            />
            <img 
              src={logoWhiteUrl} 
              alt="ChatPad" 
              className="h-8 w-8 object-contain hidden dark:block"
            />
            <span className="text-lg font-semibold text-foreground">ChatPad</span>
          </div>
          
          {/* Step Progress (only for signup) */}
          {activeTab === 'signup' && (
            <StepProgress steps={signupSteps} currentStep={currentStep} className="pr-4" />
          )}

          {/* Sign in sidebar content */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to continue where you left off.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center px-8 py-6 text-sm text-muted-foreground">
          <p>© ChatPad 2024</p>
          <a href="mailto:help@chatpad.ai" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Mail01 className="w-4 h-4" />
            help@chatpad.ai
          </a>
        </footer>
      </div>

      {/* Right Content Area */}
      <div className="flex h-full w-full flex-1 overflow-hidden py-8 md:py-12">
        <div className="flex h-full w-full flex-col items-center gap-8 px-4 md:px-8">
          {/* Mobile Logo with text */}
          <div className="lg:hidden flex items-center gap-3">
            <img 
              src={logoBlackUrl} 
              alt="ChatPad" 
              className="h-8 w-8 object-contain dark:hidden"
            />
            <img 
              src={logoWhiteUrl} 
              alt="ChatPad" 
              className="h-8 w-8 object-contain hidden dark:block"
            />
            <span className="text-lg font-semibold text-foreground">ChatPad</span>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-8 flex-1 justify-center">
            <AnimatePresence mode="wait">
              {activeTab === 'signin' ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative">
                      <FeaturedIcon color="gray" theme="modern" size="xl" className="relative z-10">
                        <Key01 />
                      </FeaturedIcon>
                      <BackgroundPattern
                        pattern="grid"
                        size="lg"
                        className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                    <div className="z-10 flex flex-col gap-2">
                      <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
                      <p className="text-sm text-muted-foreground">Welcome back! Please enter your details.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSignIn} className="z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
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
                          className="h-11 pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <Label htmlFor="remember" className="text-sm text-muted-foreground font-normal">
                          Remember for 30 days
                        </Label>
                      </div>
                      <button type="button" className="text-sm text-primary hover:text-primary/80">
                        Forgot password
                      </button>
                    </div>

                    <Button type="submit" className="w-full h-11" loading={isLoading}>
                      Sign in
                    </Button>

                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-11" 
                      disabled={isLoading}
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </Button>
                  </form>

                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">Don't have an account? </span>
                    <button 
                      onClick={() => { setActiveTab('signup'); setCurrentStep(0); }}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </motion.div>
              ) : (
                renderSignupStepContent()
              )}
            </AnimatePresence>

            {/* Pagination Dots (signup only) */}
            {activeTab === 'signup' && (
              <div className="flex justify-center mt-auto">
                <PaginationDots total={4} current={currentStep} size="md" />
              </div>
            )}

            {/* Back to Sign In (signup only, except completion) */}
            {activeTab === 'signup' && currentStep < 3 && (
              <div className="text-center">
                <span className="text-sm text-muted-foreground">Already have an account? </span>
                <button 
                  onClick={() => { setActiveTab('signin'); setCurrentStep(0); }}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Auth;
