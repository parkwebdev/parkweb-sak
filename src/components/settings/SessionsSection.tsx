/**
 * SessionsSection Component
 * 
 * Allows users to view their current session and sign out of other devices.
 * Part of the Settings page security improvements.
 * 
 * @module components/settings/SessionsSection
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Monitor01, Phone01, Globe02, Shield01, LogOut01, CheckCircle } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';

interface SessionInfo {
  device: string;
  deviceIcon: typeof Monitor01;
  browser: string;
  lastActive: string;
  isCurrent: boolean;
}

function detectDeviceInfo(): SessionInfo {
  const ua = navigator.userAgent;
  
  // Detect device type
  let device = 'Desktop';
  let deviceIcon = Monitor01;
  
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
    deviceIcon = Phone01;
  }
  
  // Detect browser
  let browser = 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  }
  
  // Detect OS
  let os = '';
  if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }
  
  return {
    device: os ? `${device} (${os})` : device,
    deviceIcon,
    browser,
    lastActive: 'Now',
    isCurrent: true,
  };
}

export function SessionsSection() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [signOutSuccess, setSignOutSuccess] = useState(false);
  
  const currentSession = useMemo(() => detectDeviceInfo(), []);
  
  const handleSignOutOtherSessions = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      
      if (error) {
        toast.error("Failed to sign out other sessions", { description: error.message });
        return;
      }
      
      setSignOutSuccess(true);
      toast.success("Signed out of other devices", { 
        description: "All other sessions have been terminated." 
      });
      
      // Reset success state after animation
      setTimeout(() => setSignOutSuccess(false), 3000);
    } catch (error) {
      toast.error("Error", { description: "An unexpected error occurred" });
    } finally {
      setIsSigningOut(false);
      setShowConfirmDialog(false);
    }
  };
  
  const DeviceIcon = currentSession.deviceIcon;
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className="space-y-6"
    >
      {/* Current Session Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield01 size={20} className="text-primary" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Session */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <DeviceIcon size={20} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {currentSession.device}
                  </span>
                  <Badge variant="outline" className="text-2xs bg-status-active/10 text-status-active border-status-active/20">
                    Current
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe02 size={14} />
                  <span>{currentSession.browser}</span>
                  <span className="text-border">•</span>
                  <span>Active now</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Session Security Info */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium text-foreground mb-2">Session Security</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-status-active" />
                Logged in as {user?.email}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-status-active" />
                Session protected with secure authentication
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Sign Out Other Devices Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut01 size={20} className="text-muted-foreground" />
            Other Devices
          </CardTitle>
          <CardDescription>
            Sign out of all other devices and sessions where you're logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Sign out everywhere else
              </p>
              <p className="text-sm text-muted-foreground">
                This will terminate all sessions except your current one.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSigningOut}
              className="shrink-0"
            >
              {signOutSuccess ? (
                <>
                  <CheckCircle size={16} className="text-status-active" />
                  Done
                </>
              ) : (
                <>
                  <LogOut01 size={16} />
                  Sign out other sessions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all other browsers and devices where you're currently logged in. 
              Your current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOutOtherSessions}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign out other sessions'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
