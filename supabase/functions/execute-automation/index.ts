/**
 * Execute Automation Edge Function
 * Executes an automation flow with all its nodes.
 * 
 * @module functions/execute-automation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/errors.ts";
import type { ExecutionContext, Automation, AutomationNode, AutomationEdge, NodeExecutionResult } from "../_shared/automation/types.ts";
import { executeNode } from "../_shared/automation/executors/index.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { automationId, triggerType, triggerData, conversationId, leadId, testMode } = await req.json();

    if (!automationId) {
      return new Response(JSON.stringify({ error: "automationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load automation
    const { data: automation, error: loadError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", automationId)
      .single();

    if (loadError || !automation) {
      return new Response(JSON.stringify({ error: "Automation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if enabled (skip for test mode)
    if (!testMode && !automation.enabled) {
      return new Response(JSON.stringify({ error: "Automation is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nodes = automation.nodes as AutomationNode[];
    const edges = automation.edges as AutomationEdge[];

    // Create execution record
    const executionId = crypto.randomUUID();
    
    if (!testMode) {
      await supabase.from("automation_executions").insert({
        id: executionId,
        automation_id: automationId,
        trigger_type: triggerType || automation.trigger_type,
        trigger_data: triggerData || {},
        conversation_id: conversationId,
        lead_id: leadId,
        status: "running",
        test_mode: false,
      });
    }

    // Initialize execution context
    const context: ExecutionContext = {
      automationId,
      executionId,
      agentId: automation.agent_id,
      userId: automation.user_id,
      triggerType: triggerType || automation.trigger_type,
      triggerData: triggerData || {},
      conversationId,
      leadId,
      variables: {},
      testMode: testMode || false,
      nodesExecuted: [],
      startTime,
    };

    // Find trigger node (entry point)
    const triggerNode = nodes.find((n) => n.type.startsWith("trigger-"));
    if (!triggerNode) {
      throw new Error("No trigger node found in automation");
    }

    // Execute nodes in topological order
    const executed = new Set<string>();
    const queue: string[] = [triggerNode.id];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (executed.has(nodeId)) continue;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      // Check if node is disabled
      if (node.data?.disabled) {
        executed.add(nodeId);
        // Add next nodes to queue
        const outgoingEdges = edges.filter((e) => e.source === nodeId);
        for (const edge of outgoingEdges) {
          queue.push(edge.target);
        }
        continue;
      }

      const nodeStartTime = performance.now();
      console.log(`Executing node: ${node.type} (${nodeId})`);

      const result = await executeNode(node, context, supabase);

      const nodeResult: NodeExecutionResult = {
        nodeId,
        nodeType: node.type,
        status: result.success ? "success" : "error",
        output: result.output,
        error: result.error,
        durationMs: performance.now() - nodeStartTime,
        timestamp: new Date().toISOString(),
      };

      context.nodesExecuted.push(nodeResult);
      executed.add(nodeId);

      // Merge variables
      if (result.setVariables) {
        Object.assign(context.variables, result.setVariables);
      }

      // Check for stop
      if (result.shouldStop) {
        console.log("Execution stopped by node");
        break;
      }

      // Handle branching for condition nodes
      if (result.branch) {
        const branchEdge = edges.find(
          (e) => e.source === nodeId && e.sourceHandle === result.branch
        );
        if (branchEdge) {
          queue.push(branchEdge.target);
        }
      } else {
        // Add all outgoing nodes to queue
        const outgoingEdges = edges.filter((e) => e.source === nodeId);
        for (const edge of outgoingEdges) {
          queue.push(edge.target);
        }
      }

      // Check for errors
      if (!result.success) {
        console.error(`Node ${nodeId} failed: ${result.error}`);
        break;
      }
    }

    const durationMs = performance.now() - startTime;
    const hasError = context.nodesExecuted.some((n) => n.status === "error");

    // Update execution record
    if (!testMode) {
      await supabase
        .from("automation_executions")
        .update({
          status: hasError ? "failed" : "completed",
          completed_at: new Date().toISOString(),
          duration_ms: Math.round(durationMs),
          nodes_executed: context.nodesExecuted,
          variables: context.variables,
          error: hasError ? context.nodesExecuted.find((n) => n.status === "error")?.error : null,
          error_node_id: hasError ? context.nodesExecuted.find((n) => n.status === "error")?.nodeId : null,
        })
        .eq("id", executionId);
    }

    return new Response(
      JSON.stringify({
        success: !hasError,
        executionId,
        nodesExecuted: context.nodesExecuted.length,
        durationMs: Math.round(durationMs),
        variables: context.variables,
        error: hasError ? context.nodesExecuted.find((n) => n.status === "error")?.error : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Execution error:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
