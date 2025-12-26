/**
 * AriCustomToolsSection
 * 
 * Custom tools management with full CRUD, test, and debug capabilities.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash01, Link03, Edit03, PlayCircle, ChevronDown, Plus, Lightbulb02, Code01 } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonListSection } from '@/components/ui/skeleton';
import { AriSectionHeader } from './AriSectionHeader';
import { CreateToolDialog } from '@/components/agents/CreateToolDialog';
import { EditToolDialog } from '@/components/agents/EditToolDialog';
import { TestToolResultDialog } from '@/components/agents/TestToolResultDialog';
import { ToolUseCasesModal } from '@/components/agents/ToolUseCasesModal';
import { DebugConsole } from '@/components/agents/DebugConsole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { Tables, Json } from '@/integrations/supabase/types';

type AgentTool = Tables<'agent_tools'>;

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  responseTime?: number;
  body?: unknown;
  error?: string;
}

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: unknown;
}

interface AriCustomToolsSectionProps {
  agentId: string;
}

export function AriCustomToolsSection({ agentId }: AriCustomToolsSectionProps) {
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null);
  const [showUseCasesModal, setShowUseCasesModal] = useState(false);
  
  // Test states
  const [testingToolId, setTestingToolId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testingToolName, setTestingToolName] = useState('');
  
  // Debug mode
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  
  // Expanded details
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTools();
  }, [agentId]);

  const addDebugLog = (level: DebugLog['level'], message: string, details?: unknown) => {
    if (!debugMode) return;
    setDebugLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      details
    }]);
  };

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      logger.error('Error fetching tools:', error);
      toast.error('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTool = async (toolData: {
    name: string;
    description: string;
    endpoint_url: string;
    parameters: string;
    headers?: string;
    timeout_ms?: number;
  }) => {
    addDebugLog('info', 'Creating tool...', toolData);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let parsedParams: Json = {};
      if (toolData.parameters) {
        try {
          parsedParams = JSON.parse(toolData.parameters);
        } catch {
          toast.error('Invalid JSON in parameters');
          return;
        }
      }

      let parsedHeaders: Json | null = null;
      if (toolData.headers) {
        try {
          parsedHeaders = JSON.parse(toolData.headers);
        } catch {
          toast.error('Invalid JSON in headers');
          return;
        }
      }

      const { data, error } = await supabase
        .from('agent_tools')
        .insert({
          agent_id: agentId,
          name: toolData.name,
          description: toolData.description,
          endpoint_url: toolData.endpoint_url,
          parameters: parsedParams,
          headers: parsedHeaders,
          timeout_ms: toolData.timeout_ms || 30000,
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;
      
      setTools(prev => [data, ...prev]);
      addDebugLog('success', 'Tool created successfully', data);
      toast.success('Tool created');
    } catch (error) {
      logger.error('Error creating tool:', error);
      addDebugLog('error', 'Failed to create tool', error);
      toast.error('Failed to create tool');
    }
  };

  const handleUpdateTool = async (id: string, updates: Partial<AgentTool>) => {
    addDebugLog('info', 'Updating tool...', { id, updates });
    
    try {
      const { error } = await supabase
        .from('agent_tools')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setTools(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      addDebugLog('success', 'Tool updated successfully');
      toast.success('Tool updated');
    } catch (error) {
      logger.error('Error updating tool:', error);
      addDebugLog('error', 'Failed to update tool', error);
      toast.error('Failed to update tool');
    }
  };

  const toggleTool = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('agent_tools')
      .update({ enabled })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update tool');
      return;
    }
    
    setTools(tools.map(t => t.id === id ? { ...t, enabled } : t));
    addDebugLog('info', `Tool ${enabled ? 'enabled' : 'disabled'}`);
  };

  const deleteTool = async (id: string) => {
    addDebugLog('info', 'Deleting tool...', { id });
    
    const { error } = await supabase
      .from('agent_tools')
      .delete()
      .eq('id', id);

    if (error) {
      addDebugLog('error', 'Failed to delete tool', error);
      toast.error('Failed to delete tool');
      return;
    }
    
    setTools(tools.filter(t => t.id !== id));
    addDebugLog('success', 'Tool deleted');
    toast.success('Tool deleted');
  };

  const testTool = async (tool: AgentTool) => {
    setTestingToolId(tool.id);
    setTestingToolName(tool.name);
    setTestResult(null);
    setShowTestDialog(true);
    
    addDebugLog('info', `Testing tool: ${tool.name}`, { endpoint: tool.endpoint_url });

    try {
      const { data, error } = await supabase.functions.invoke('test-tool-endpoint', {
        body: {
          agentId,
          toolId: tool.id,
          endpointUrl: tool.endpoint_url,
          headers: tool.headers,
          timeoutMs: tool.timeout_ms
        }
      });

      if (error) throw error;
      
      setTestResult(data);
      addDebugLog(data.success ? 'success' : 'error', `Test ${data.success ? 'passed' : 'failed'}`, data);
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      };
      setTestResult(result);
      addDebugLog('error', 'Test failed', error);
    } finally {
      setTestingToolId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return <SkeletonListSection items={3} />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Custom Tools"
        description="Add custom tools that extend Ari's capabilities with external APIs"
      />

      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            Add Tool
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowUseCasesModal(true)}>
            <Lightbulb02 size={14} className="mr-1.5" />
            View Use Cases
          </Button>
          <div className="flex-1" />
          <Button
            variant={debugMode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
          >
            <Code01 size={14} className="mr-1.5" />
            Debug Mode
          </Button>
        </div>

        {/* Tools List */}
        {tools.length === 0 ? (
          <EmptyState
            icon={<Link03 className="h-5 w-5 text-muted-foreground/50" />}
            title="No tools configured yet"
            description="Tools let Ari call external APIs for real-time data"
          />
        ) : (
          <div className="space-y-2">
            {tools.map((tool) => (
              <div key={tool.id} className="rounded-lg border bg-card overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-mono font-semibold">{tool.name}</h4>
                        {!tool.enabled && (
                          <Badge variant="secondary" size="sm">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                      {tool.endpoint_url && (
                        <p className="text-xs font-mono text-muted-foreground/70 truncate">
                          {tool.endpoint_url}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={tool.enabled ?? true}
                        onCheckedChange={(checked) => toggleTool(tool.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testTool(tool)}
                        disabled={testingToolId === tool.id}
                      >
                        <PlayCircle size={14} className={testingToolId === tool.id ? 'animate-spin' : ''} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingTool(tool)}>
                        <Edit03 size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTool(tool.id)}>
                        <Trash01 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Details */}
                <Collapsible open={expandedTools.has(tool.id)} onOpenChange={() => toggleExpanded(tool.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50 flex items-center gap-1 border-t">
                      <ChevronDown 
                        size={12} 
                        className={`transition-transform ${expandedTools.has(tool.id) ? 'rotate-180' : ''}`} 
                      />
                      View Details
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3 border-t bg-muted/20">
                      <div className="pt-3">
                        <p className="text-xs font-medium mb-1">Parameters (JSON Schema)</p>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-32 font-mono">
                          {JSON.stringify(tool.parameters, null, 2)}
                        </pre>
                      </div>
                      {tool.headers && Object.keys(tool.headers as object).length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Headers</p>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-24 font-mono">
                            {JSON.stringify(tool.headers, null, 2)}
                          </pre>
                        </div>
                      )}
                      {tool.timeout_ms && (
                        <div>
                          <p className="text-xs font-medium mb-1">Timeout</p>
                          <p className="text-xs text-muted-foreground">{tool.timeout_ms}ms</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}

        {/* Debug Console */}
        {debugMode && (
          <DebugConsole 
            logs={debugLogs} 
            onClear={() => setDebugLogs([])} 
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateToolDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTool={handleCreateTool}
      />

      <EditToolDialog
        open={!!editingTool}
        onOpenChange={(open) => !open && setEditingTool(null)}
        tool={editingTool}
        onSave={async (toolId, updates) => {
          // Parse JSON strings back to objects for database
          let parsedParams = {};
          let parsedHeaders = null;
          try {
            if (updates.parameters) parsedParams = JSON.parse(updates.parameters);
            if (updates.headers) parsedHeaders = JSON.parse(updates.headers);
          } catch {
            // Keep defaults
          }
          await handleUpdateTool(toolId, {
            name: updates.name,
            description: updates.description,
            endpoint_url: updates.endpoint_url,
            parameters: parsedParams,
            headers: parsedHeaders,
            timeout_ms: updates.timeout_ms
          });
          setEditingTool(null);
        }}
      />

      <TestToolResultDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        toolName={testingToolName}
        loading={!!testingToolId}
        result={testResult}
      />

      <ToolUseCasesModal
        open={showUseCasesModal}
        onOpenChange={setShowUseCasesModal}
      />
    </div>
  );
};
