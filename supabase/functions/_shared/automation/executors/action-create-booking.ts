/**
 * Create Booking Action Node Executor
 * Creates a calendar event/booking in the database.
 * 
 * @module _shared/automation/executors/action-create-booking
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface CreateBookingNodeData {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // minutes, used if endTime not provided
  timezone?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  eventType?: string;
  locationId?: string;
  connectedAccountId?: string;
  leadId?: string;
  conversationId?: string;
  notes?: string;
  outputVariable?: string;
}

export async function executeCreateBookingNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as CreateBookingNodeData;

  // Validate required fields
  if (!data.title) {
    return {
      success: false,
      error: "Booking title is required",
    };
  }

  if (!data.startTime) {
    return {
      success: false,
      error: "Start time is required",
    };
  }

  if (!data.connectedAccountId) {
    return {
      success: false,
      error: "Connected calendar account ID is required",
    };
  }

  // Create Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Resolve variables in all fields
    const resolvedTitle = resolveVariables(data.title, context);
    const resolvedDescription = data.description 
      ? resolveVariables(data.description, context) 
      : null;
    const resolvedStartTime = resolveVariables(data.startTime, context);
    const resolvedVisitorName = data.visitorName 
      ? resolveVariables(data.visitorName, context) 
      : null;
    const resolvedVisitorEmail = data.visitorEmail 
      ? resolveVariables(data.visitorEmail, context) 
      : null;
    const resolvedVisitorPhone = data.visitorPhone 
      ? resolveVariables(data.visitorPhone, context) 
      : null;
    const resolvedNotes = data.notes 
      ? resolveVariables(data.notes, context) 
      : null;

    // Parse start time
    let startDate: Date;
    try {
      startDate = new Date(resolvedStartTime);
      if (isNaN(startDate.getTime())) {
        return {
          success: false,
          error: `Invalid start time format: ${resolvedStartTime}`,
        };
      }
    } catch {
      return {
        success: false,
        error: `Invalid start time format: ${resolvedStartTime}`,
      };
    }

    // Calculate end time
    let endDate: Date;
    if (data.endTime) {
      const resolvedEndTime = resolveVariables(data.endTime, context);
      endDate = new Date(resolvedEndTime);
      if (isNaN(endDate.getTime())) {
        return {
          success: false,
          error: `Invalid end time format: ${resolvedEndTime}`,
        };
      }
    } else {
      // Use duration (default 30 minutes)
      const durationMinutes = data.duration || 30;
      endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    }

    // Get lead ID from context if not provided
    let leadId = data.leadId 
      ? resolveVariables(data.leadId, context)
      : context.leadId;
    
    if (!leadId && context.triggerData.lead_id) {
      leadId = context.triggerData.lead_id as string;
    }

    // Get conversation ID from context if not provided
    let conversationId = data.conversationId
      ? resolveVariables(data.conversationId, context)
      : context.conversationId;

    // Get location ID
    let locationId = data.locationId
      ? resolveVariables(data.locationId, context)
      : null;

    // If no location ID, try to get from connected account
    if (!locationId) {
      const { data: account } = await supabase
        .from("connected_accounts")
        .select("location_id")
        .eq("id", data.connectedAccountId)
        .single();
      
      if (account?.location_id) {
        locationId = account.location_id;
      }
    }

    // Build event object
    const eventData = {
      title: resolvedTitle,
      description: resolvedDescription,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      timezone: data.timezone || "UTC",
      connected_account_id: data.connectedAccountId,
      event_type: data.eventType || "booking",
      status: "confirmed",
      visitor_name: resolvedVisitorName,
      visitor_email: resolvedVisitorEmail,
      visitor_phone: resolvedVisitorPhone,
      lead_id: leadId || null,
      conversation_id: conversationId || null,
      location_id: locationId || null,
      notes: resolvedNotes,
      metadata: {
        created_by: "automation",
        automation_id: context.automationId,
        execution_id: context.executionId,
      },
    };

    console.log(`Creating booking: ${resolvedTitle} at ${startDate.toISOString()}`);

    // Insert into calendar_events
    const { data: createdEvent, error: insertError } = await supabase
      .from("calendar_events")
      .insert(eventData)
      .select()
      .single();

    if (insertError) {
      console.error("Booking creation error:", insertError);
      return {
        success: false,
        error: `Failed to create booking: ${insertError.message}`,
      };
    }

    console.log("Booking created successfully:", createdEvent.id);

    // Set output variables
    const setVariables: Record<string, unknown> = {
      booking: createdEvent,
      booking_id: createdEvent.id,
    };
    if (data.outputVariable) {
      setVariables[data.outputVariable] = createdEvent;
    }

    return {
      success: true,
      output: {
        eventId: createdEvent.id,
        title: resolvedTitle,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        event: createdEvent,
      },
      setVariables,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error creating booking";
    console.error("Create booking execution error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
