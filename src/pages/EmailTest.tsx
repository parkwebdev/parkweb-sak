import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailTest = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const testEmail = 'aaron@park-web.com';

  const testStageEmail = async (templateName: string, variables: Record<string, any>) => {
    setLoading(templateName);
    try {
      const { data, error } = await supabase.functions.invoke('send-stage-email', {
        body: {
          templateName,
          clientEmail: testEmail,
          variables
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `${templateName} email sent successfully to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: error.message || `Failed to send ${templateName} email`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const testContinueLink = async () => {
    setLoading('continue-link');
    try {
      const { data, error } = await supabase.functions.invoke('send-continue-link', {
        body: {
          clientEmail: testEmail,
          clientName: 'Aaron Test',
          companyName: 'Test Company',
          continueUrl: `${window.location.origin}/onboarding/test-123`
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Continue link email sent successfully to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending continue link:', error);
      toast({
        title: "Email Failed",
        description: error.message || 'Failed to send continue link email',
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const testNotificationEmail = async (type: string) => {
    setLoading(`notification-${type}`);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: testEmail,
          type: type,
          title: `Test ${type} Notification`,
          message: `This is a test ${type} notification sent to verify email functionality.`,
          data: {
            testField: 'test value',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `${type} notification email sent successfully to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending notification email:', error);
      toast({
        title: "Email Failed",
        description: error.message || `Failed to send ${type} notification email`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Email System Test</h1>
        <p className="text-muted-foreground">
          Testing all email functionality by sending samples to {testEmail}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage Email Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Stage Email Templates</CardTitle>
            <CardDescription>Test template-based emails using Resend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => testStageEmail('welcome', {
                client_name: 'Aaron Test',
                company_name: 'Test Company',
                onboarding_url: `${window.location.origin}/onboarding/test-123`
              })}
              disabled={loading === 'welcome'}
              className="w-full"
            >
              {loading === 'welcome' ? 'Sending...' : 'Test Welcome Email'}
            </Button>

            <Button
              onClick={() => testStageEmail('reminder', {
                client_name: 'Aaron Test',
                company_name: 'Test Company',
                onboarding_url: `${window.location.origin}/onboarding/test-123`
              })}
              disabled={loading === 'reminder'}
              className="w-full"
            >
              {loading === 'reminder' ? 'Sending...' : 'Test Reminder Email'}
            </Button>

            <Button
              onClick={() => testStageEmail('completion', {
                client_name: 'Aaron Test',
                company_name: 'Test Company'
              })}
              disabled={loading === 'completion'}
              className="w-full"
            >
              {loading === 'completion' ? 'Sending...' : 'Test Completion Email'}
            </Button>

            <Button
              onClick={() => testStageEmail('follow_up', {
                client_name: 'Aaron Test',
                company_name: 'Test Company'
              })}
              disabled={loading === 'follow_up'}
              className="w-full"
            >
              {loading === 'follow_up' ? 'Sending...' : 'Test Follow-up Email'}
            </Button>
          </CardContent>
        </Card>

        {/* Continue Link Test */}
        <Card>
          <CardHeader>
            <CardTitle>Continue Link Email</CardTitle>
            <CardDescription>Test continue link email functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testContinueLink}
              disabled={loading === 'continue-link'}
              className="w-full"
            >
              {loading === 'continue-link' ? 'Sending...' : 'Test Continue Link Email'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Email Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Emails</CardTitle>
            <CardDescription>Test various notification email types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => testNotificationEmail('team')}
              disabled={loading === 'notification-team'}
              className="w-full"
            >
              {loading === 'notification-team' ? 'Sending...' : 'Test Team Notification'}
            </Button>

            <Button
              onClick={() => testNotificationEmail('system')}
              disabled={loading === 'notification-system'}
              className="w-full"
            >
              {loading === 'notification-system' ? 'Sending...' : 'Test System Notification'}
            </Button>

            <Button
              onClick={() => testNotificationEmail('scope_work')}
              disabled={loading === 'notification-scope_work'}
              className="w-full"
            >
              {loading === 'notification-scope_work' ? 'Sending...' : 'Test Scope Work Notification'}
            </Button>

            <Button
              onClick={() => testNotificationEmail('security')}
              disabled={loading === 'notification-security'}
              className="w-full"
            >
              {loading === 'notification-security' ? 'Sending...' : 'Test Security Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Information</CardTitle>
            <CardDescription>Email testing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Test Email:</strong> {testEmail}</p>
            <p><strong>Functions Tested:</strong></p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>send-stage-email (welcome, reminder, completion, follow_up)</li>
              <li>send-continue-link</li>
              <li>send-notification-email (team, system, scope_work, security)</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Check the Supabase Edge Function logs and your inbox for results.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTest;