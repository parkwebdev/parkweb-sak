/**
 * Email Logging Utility
 * 
 * Shared helper for logging email sends to the email_delivery_logs table.
 * Creates initial log entries when emails are sent, which are then updated
 * by the Resend webhook with delivery status, opens, clicks, etc.
 * 
 * @module functions/_shared/email-logging
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface EmailLogData {
  /** Resend email ID from the send response */
  resendEmailId: string;
  /** Recipient email address */
  toEmail: string;
  /** Sender email address */
  fromEmail: string;
  /** Email subject line */
  subject: string;
  /** Template type for categorization */
  templateType: string;
  /** Optional metadata to store */
  metadata?: Record<string, unknown>;
}

/**
 * Logs an email send to the email_delivery_logs table.
 * This creates the initial record with status='sent' which will be
 * updated by the Resend webhook with delivery events.
 * 
 * @param supabase - Supabase client with service role key
 * @param data - Email log data
 * @returns Promise<void> - Logs error but doesn't throw to avoid blocking email sends
 */
export async function logEmailSent(
  supabase: SupabaseClient,
  data: EmailLogData
): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_delivery_logs')
      .insert({
        resend_email_id: data.resendEmailId,
        to_email: data.toEmail,
        from_email: data.fromEmail,
        subject: data.subject,
        template_type: data.templateType,
        status: 'sent',
        metadata: data.metadata || {},
      });

    if (error) {
      console.error('[email-logging] Failed to log email:', error);
    } else {
      console.log(`[email-logging] Logged email send: ${data.resendEmailId} -> ${data.toEmail}`);
    }
  } catch (err) {
    // Don't throw - logging should never block email delivery
    console.error('[email-logging] Error logging email:', err);
  }
}
