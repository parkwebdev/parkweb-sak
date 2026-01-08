/**
 * Update Lead Action Node Executor
 * Updates lead fields in the database.
 * 
 * @module _shared/automation/executors/action-update-lead
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface FieldUpdate {
  field: string;
  value: string;
  type?: "string" | "number" | "boolean" | "json";
}

interface UpdateLeadNodeData {
  leadId?: string;
  fields?: FieldUpdate[];
  outputVariable?: string;
}

// Allowed fields that can be updated
const ALLOWED_LEAD_FIELDS = [
  "name",
  "email",
  "phone",
  "company",
  "status",
  "stage_id",
  "assigned_to",
  "data",
];

// Allowed data subfields within the JSONB data column
const ALLOWED_DATA_FIELDS = [
  "priority",
  "source",
  "notes",
  "tags",
  "custom",
];

export async function executeUpdateLeadNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as UpdateLeadNodeData;

  // Get lead ID from node data or context
  let leadId = data.leadId 
    ? resolveVariables(data.leadId, context)
    : context.leadId;

  // Fallback to trigger data
  if (!leadId && context.triggerData.lead_id) {
    leadId = context.triggerData.lead_id as string;
  }
  if (!leadId && context.triggerData.lead?.id) {
    leadId = (context.triggerData.lead as { id: string }).id;
  }

  if (!leadId) {
    return {
      success: false,
      error: "Lead ID is required. Provide it in node config or ensure trigger provides lead context.",
    };
  }

  if (!data.fields || data.fields.length === 0) {
    return {
      success: false,
      error: "At least one field update is required",
    };
  }

  // Create Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, fetch current lead to get existing data
    const { data: currentLead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !currentLead) {
      return {
        success: false,
        error: `Lead not found: ${leadId}`,
      };
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    const dataUpdates: Record<string, unknown> = { ...(currentLead.data || {}) };
    let hasDataUpdates = false;

    for (const fieldUpdate of data.fields) {
      const { field, value, type } = fieldUpdate;

      // Resolve variables in value
      const resolvedValue = resolveVariables(value, context);

      // Convert value based on type
      let typedValue: unknown = resolvedValue;
      if (type === "number") {
        typedValue = Number(resolvedValue);
        if (isNaN(typedValue as number)) {
          return {
            success: false,
            error: `Invalid number value for field ${field}: ${resolvedValue}`,
          };
        }
      } else if (type === "boolean") {
        typedValue = resolvedValue === "true" || resolvedValue === "1";
      } else if (type === "json") {
        try {
          typedValue = JSON.parse(resolvedValue);
        } catch {
          return {
            success: false,
            error: `Invalid JSON value for field ${field}: ${resolvedValue}`,
          };
        }
      }

      // Check if it's a direct lead field or a data subfield
      if (ALLOWED_LEAD_FIELDS.includes(field)) {
        updates[field] = typedValue;
      } else if (ALLOWED_DATA_FIELDS.includes(field) || field.startsWith("data.")) {
        // Handle data.* fields
        const dataField = field.startsWith("data.") ? field.substring(5) : field;
        dataUpdates[dataField] = typedValue;
        hasDataUpdates = true;
      } else {
        // Store in custom field within data
        dataUpdates.custom = {
          ...(dataUpdates.custom as Record<string, unknown> || {}),
          [field]: typedValue,
        };
        hasDataUpdates = true;
      }
    }

    // Merge data updates
    if (hasDataUpdates) {
      updates.data = dataUpdates;
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    console.log(`Updating lead ${leadId}:`, Object.keys(updates));

    // Perform update
    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", leadId)
      .select()
      .single();

    if (updateError) {
      console.error("Lead update error:", updateError);
      return {
        success: false,
        error: `Failed to update lead: ${updateError.message}`,
      };
    }

    console.log("Lead updated successfully");

    // Set output variables
    const setVariables: Record<string, unknown> = {
      lead: updatedLead,
    };
    if (data.outputVariable) {
      setVariables[data.outputVariable] = updatedLead;
    }

    return {
      success: true,
      output: {
        leadId,
        updatedFields: Object.keys(updates),
        lead: updatedLead,
      },
      setVariables,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error updating lead";
    console.error("Update lead execution error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
