/**
 * Email Action Node Executor
 * Sends emails via Resend API.
 * 
 * @module _shared/automation/executors/action-email
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";

interface EmailNodeData {
  to?: string;
  subject?: string;
  body?: string;
  bodyType?: "text" | "html";
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
  outputVariable?: string;
}

export async function executeEmailNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as EmailNodeData;

  // Validate required fields
  if (!data.to) {
    return {
      success: false,
      error: "Recipient email (to) is required",
    };
  }

  if (!data.subject) {
    return {
      success: false,
      error: "Subject is required",
    };
  }

  if (!data.body) {
    return {
      success: false,
      error: "Email body is required",
    };
  }

  // Check for Resend API key
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured",
    };
  }

  // Resolve variables in all fields
  const resolvedTo = resolveVariables(data.to, context);
  const resolvedSubject = resolveVariables(data.subject, context);
  const resolvedBody = resolveVariables(data.body, context);
  const resolvedFromName = data.fromName ? resolveVariables(data.fromName, context) : "Pilot";
  const resolvedFromEmail = data.fromEmail ? resolveVariables(data.fromEmail, context) : "noreply@resend.dev";
  const resolvedReplyTo = data.replyTo ? resolveVariables(data.replyTo, context) : undefined;
  const resolvedCc = data.cc ? resolveVariables(data.cc, context) : undefined;
  const resolvedBcc = data.bcc ? resolveVariables(data.bcc, context) : undefined;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(resolvedTo)) {
    return {
      success: false,
      error: `Invalid recipient email format: ${resolvedTo}`,
    };
  }

  try {
    console.log(`Sending email to ${resolvedTo}: ${resolvedSubject}`);

    // Build email payload
    const emailPayload: Record<string, unknown> = {
      from: `${resolvedFromName} <${resolvedFromEmail}>`,
      to: [resolvedTo],
      subject: resolvedSubject,
    };

    // Set body based on type
    if (data.bodyType === "html") {
      emailPayload.html = resolvedBody;
    } else {
      emailPayload.text = resolvedBody;
    }

    // Add optional fields
    if (resolvedReplyTo) {
      emailPayload.reply_to = resolvedReplyTo;
    }
    if (resolvedCc) {
      emailPayload.cc = resolvedCc.split(",").map((e: string) => e.trim());
    }
    if (resolvedBcc) {
      emailPayload.bcc = resolvedBcc.split(",").map((e: string) => e.trim());
    }

    // Send via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", responseData);
      return {
        success: false,
        error: responseData.message || `Email sending failed with status ${response.status}`,
        output: responseData,
      };
    }

    console.log("Email sent successfully:", responseData.id);

    // Set output variables
    const setVariables: Record<string, unknown> = {};
    if (data.outputVariable) {
      setVariables[data.outputVariable] = responseData;
    }
    setVariables.email_response = {
      id: responseData.id,
      to: resolvedTo,
      subject: resolvedSubject,
    };

    return {
      success: true,
      output: responseData,
      setVariables,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error sending email";
    console.error("Email execution error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
