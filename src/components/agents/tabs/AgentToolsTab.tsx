import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash01, ChevronDown, Link03, Eye, FlipBackward, Lightbulb01, Edit03, Tool02 } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateToolDialog } from '@/components/agents/CreateToolDialog';
import { EditToolDialog } from '@/components/agents/EditToolDialog';
import { TestToolResultDialog } from '@/components/agents/TestToolResultDialog';
import { CopyButton } from '@/components/ui/copy-button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import type { Tables } from '@/integrations/supabase/types';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { useWebhooks } from '@/hooks/useWebhooks';
import { CreateWebhookDialog } from '@/components/agents/webhooks/CreateWebhookDialog';
import { EditWebhookDialog } from '@/components/agents/webhooks/EditWebhookDialog';
import { WebhookLogsDialog } from '@/components/agents/webhooks/WebhookLogsDialog';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { AgentApiKeyManager } from '@/components/agents/AgentApiKeyManager';
import { ApiUseCasesModal } from '@/components/agents/ApiUseCasesModal';
import { ToolUseCasesModal } from '@/components/agents/ToolUseCasesModal';
import { DebugConsole, useDebugLogs } from '@/components/agents/DebugConsole';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

type AgentTool = Tables<'agent_tools'>;
type ToolsTab = 'api-access' | 'custom-tools' | 'webhooks';

interface AgentToolsTabProps {
  agentId: string;
  agent?: Tables<'agents'>;
  onUpdate?: (id: string, updates: any) => Promise<any>;
}

export const AgentToolsTab = ({ agentId, agent, onUpdate }: AgentToolsTabProps) => {
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ToolsTab>('api-access');
  const [showUseCasesModal, setShowUseCasesModal] = useState(false);
  const [showToolUseCasesModal, setShowToolUseCasesModal] = useState(false);
  const [showCreateToolDialog, setShowCreateToolDialog] = useState(false);
  
  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const { logs: debugLogs, log: debugLog, clear: clearDebugLogs } = useDebugLogs();
  
  // Edit tool state
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null);
  
  // Test tool state
  const [testingTool, setTestingTool] = useState<AgentTool | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Webhook state
  const { webhooks, loading: webhooksLoading, updateWebhook, deleteWebhook, testWebhook, fetchLogs } = useWebhooks(agentId);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<string | null>(null);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<Tables<'webhooks'> | null>(null);
  const [savedWebhookIds, setSavedWebhookIds] = useState<Set<string>>(new Set());

  const menuItems = [
    { 
      id: 'api-access' as const, 
      label: 'API Access',
      description: 'Authenticate programmatic access to your agent with API keys'
    },
    { 
      id: 'custom-tools' as const, 
      label: 'Custom Tools',
      description: 'Add custom tools and functions that extend your agent\'s capabilities'
    },
    { 
      id: 'webhooks' as const, 
      label: 'Webhooks',
      description: 'Configure webhooks to send real-time events to external APIs when actions occur'
    },
  ];

  const apiEndpoint = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/widget-chat`;

  useEffect(() => {
    fetchTools();
  }, [agentId]);

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

  const addTool = async (newTool: {
    name: string;
    description: string;
    endpoint_url: string;
    parameters: string;
    headers: string;
    timeout_ms: number;
  }) => {
    const parameters = JSON.parse(newTool.parameters);
    const headers = JSON.parse(newTool.headers);
    
    const { data, error } = await supabase
      .from('agent_tools')
      .insert({
        agent_id: agentId,
        name: newTool.name,
        description: newTool.description,
        endpoint_url: newTool.endpoint_url,
        parameters,
        headers,
        timeout_ms: newTool.timeout_ms,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add tool. Check JSON format.');
      throw error;
    }
    
    setTools([data, ...tools]);
    toast.success('Tool added successfully');
  };

  const updateTool = async (toolId: string, updates: {
    name: string;
    description: string;
    endpoint_url: string;
    parameters: string;
    headers: string;
    timeout_ms: number;
  }) => {
    try {
      const parameters = JSON.parse(updates.parameters);
      const headers = JSON.parse(updates.headers);
      
      const { error } = await supabase
        .from('agent_tools')
        .update({
          name: updates.name,
          description: updates.description,
          endpoint_url: updates.endpoint_url,
          parameters,
          headers,
          timeout_ms: updates.timeout_ms,
        })
        .eq('id', toolId);

      if (error) throw error;
      
      setTools(tools.map(t => t.id === toolId ? { 
        ...t, 
        name: updates.name,
        description: updates.description,
        endpoint_url: updates.endpoint_url,
        parameters,
        headers,
        timeout_ms: updates.timeout_ms,
      } : t));
      toast.success('Tool updated successfully');
    } catch (error) {
      logger.error('Error updating tool:', error);
      toast.error('Failed to update tool. Check JSON format.');
      throw error;
    }
  };

  const toggleTool = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('agent_tools')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
      
      setTools(tools.map(t => t.id === id ? { ...t, enabled } : t));
      toast.success(`Tool ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Error updating tool:', error);
      toast.error('Failed to update tool');
    }
  };

  const deleteTool = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTools(tools.filter(t => t.id !== id));
      toast.success('Tool deleted');
    } catch (error) {
      logger.error('Error deleting tool:', error);
      toast.error('Failed to delete tool');
    }
  };

  const testTool = async (tool: AgentTool) => {
    setTestingTool(tool);
    setTestResult(null);
    setTestLoading(true);

    if (debugMode) {
      debugLog.info(`Testing tool: ${tool.name}`, {
        endpoint: tool.endpoint_url,
        headers: tool.headers,
        timeout: tool.timeout_ms || 10000,
      });
    }

    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('test-tool-endpoint', {
        body: {
          endpoint_url: tool.endpoint_url,
          headers: tool.headers,
          timeout_ms: tool.timeout_ms || 10000,
          sample_data: {},
        },
      });

      const duration = Date.now() - startTime;

      if (error) throw error;
      
      if (debugMode) {
        if (data.success) {
          debugLog.success(`Tool test completed in ${duration}ms`, {
            status: data.status,
            responseTime: `${duration}ms`,
            response: data.response,
          });
        } else {
          debugLog.error(`Tool test failed after ${duration}ms`, {
            error: data.error,
          });
        }
      }
      
      setTestResult(data);
    } catch (error: unknown) {
      logger.error('Error testing tool:', error);
      
      if (debugMode) {
        debugLog.error(`Tool test error: ${getErrorMessage(error)}`, {
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      
      setTestResult({
        success: false,
        error: getErrorMessage(error),
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return;
    await deleteWebhook(webhookToDelete);
    setWebhookToDelete(null);
  };

  const handleToggleWebhook = async (id: string, active: boolean) => {
    await updateWebhook(id, { active });
    setSavedWebhookIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setSavedWebhookIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const handleTestWebhook = async (id: string) => {
    const webhook = webhooks.find(w => w.id === id);
    
    if (debugMode && webhook) {
      debugLog.info(`Testing webhook: ${webhook.name}`, {
        url: webhook.url,
        method: webhook.method,
        events: webhook.events,
      });
    }
    
    const startTime = Date.now();
    
    try {
      await testWebhook(id);
      const duration = Date.now() - startTime;
      
      if (debugMode) {
        debugLog.success(`Webhook test sent in ${duration}ms`, {
          webhookId: id,
          message: 'Check delivery logs for results',
        });
        
        // Poll for webhook log result after a short delay
        setTimeout(async () => {
          try {
            const { data: logs } = await supabase
              .from('webhook_logs')
              .select('*')
              .eq('webhook_id', id)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (logs && logs.length > 0) {
              const log = logs[0];
              if (log.delivered) {
                debugLog.success(`Webhook delivered successfully`, {
                  status: log.response_status,
                  response: log.response_body?.substring(0, 500),
                  deliveredAt: log.delivered_at,
                });
              } else {
                debugLog.error(`Webhook delivery failed`, {
                  error: log.error_message,
                  retryCount: log.retry_count,
                });
              }
            }
          } catch (err) {
            // Silent fail on log fetch
          }
        }, 2000);
      }
    } catch (error: unknown) {
      if (debugMode) {
        debugLog.error(`Webhook test failed: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleUpdateWebhook = async (id: string, updates: any) => {
    await updateWebhook(id, updates);
  };

  const handleViewLogs = (id: string) => {
    setSelectedWebhookForLogs(id);
    fetchLogs(id);
    setShowLogsDialog(true);
  };

  if (loading) {
    return <LoadingState text="Loading tools..." />;
  }

  return (
    <AgentSettingsLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as ToolsTab)}
      menuItems={menuItems}
      title="Tools"
      description={menuItems.find(item => item.id === activeTab)?.description || ''}
      headerExtra={
        <div className="flex items-center gap-2">
          <Label htmlFor="debug-mode" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5">
            <Tool02 className="h-3.5 w-3.5" />
            Debug Mode
          </Label>
          <Switch
            id="debug-mode"
            checked={debugMode}
            onCheckedChange={setDebugMode}
            className="scale-90"
          />
        </div>
      }
    >
      {activeTab === 'api-access' && (
        <div className="space-y-6">
          {/* Endpoint URL */}
          <div className="p-5 rounded-lg bg-muted/30 border border-dashed space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">API Endpoint</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUseCasesModal(true)}
                className="text-xs"
              >
                <Lightbulb01 className="h-3.5 w-3.5 mr-1.5" />
                View Use Cases
              </Button>
            </div>
            <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
              <code className="flex-1 text-xs font-mono break-all text-muted-foreground">
                {apiEndpoint}
              </code>
              <CopyButton content={apiEndpoint} showToast={true} toastMessage="API endpoint copied" />
            </div>
            <p className="text-xs text-muted-foreground">
              Requires an API key for authentication. Widget embeds don't need a key.
            </p>
          </div>

          {/* API Keys Manager */}
          <AgentApiKeyManager agentId={agentId} />
        </div>
      )}

      {activeTab === 'custom-tools' && (
        <div className="space-y-6">
          {/* Header Card - matching API Access style */}
          <div className="p-5 rounded-lg bg-muted/30 border border-dashed space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Custom Tools</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowToolUseCasesModal(true)}
                  className="text-xs"
                >
                  <Lightbulb01 className="h-3.5 w-3.5 mr-1.5" />
                  View Use Cases
                </Button>
                <Button onClick={() => setShowCreateToolDialog(true)} size="sm">
                  Add Tool
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tools let your agent call external APIs when it needs real-time data or to perform actions.
            </p>
          </div>

          {/* Tools List */}
          {tools.length === 0 ? (
            <EmptyState
              icon={<Link03 className="h-5 w-5 text-muted-foreground/50" />}
              title="No tools configured yet."
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {tools.map((tool) => (
                <div key={tool.id} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-mono font-semibold">{tool.name}</h4>
                        {!tool.endpoint_url && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                            No endpoint
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                      {tool.endpoint_url && (
                        <p className="text-xs font-mono text-muted-foreground/70 truncate mb-2">
                          {tool.endpoint_url}
                        </p>
                      )}
                      
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs px-2 -ml-2">
                            <ChevronDown className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Parameters</p>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto border">
                              {JSON.stringify(tool.parameters, null, 2)}
                            </pre>
                          </div>
                          {tool.headers && Object.keys(tool.headers as object).length > 0 && (
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">Headers</p>
                              <pre className="text-xs bg-muted p-3 rounded overflow-auto border">
                                {JSON.stringify(tool.headers, null, 2)}
                              </pre>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            Timeout: {tool.timeout_ms || 10000}ms
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={tool.enabled ?? true}
                        onCheckedChange={(checked) => toggleTool(tool.id, checked)}
                      />
                      {tool.endpoint_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testTool(tool)}
                          className="text-xs"
                        >
                          <FlipBackward className="h-3.5 w-3.5 mr-1" />
                          Test
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingTool(tool)}
                      >
                        <Edit03 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteTool(tool.id)}
                      >
                        <Trash01 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ToolUseCasesModal
            open={showToolUseCasesModal}
            onOpenChange={setShowToolUseCasesModal}
          />

          <CreateToolDialog
            open={showCreateToolDialog}
            onOpenChange={setShowCreateToolDialog}
            onCreateTool={addTool}
          />

          <EditToolDialog
            open={!!editingTool}
            onOpenChange={(open) => !open && setEditingTool(null)}
            tool={editingTool}
            onSave={updateTool}
          />

          <TestToolResultDialog
            open={!!testingTool}
            onOpenChange={(open) => !open && setTestingTool(null)}
            toolName={testingTool?.name || ''}
            loading={testLoading}
            result={testResult}
          />
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-4">
        {webhooksLoading ? (
            <LoadingState size="sm" text="Loading webhooks..." />
          ) : webhooks.length === 0 ? (
            <EmptyState
              icon={<Link03 className="h-5 w-5 text-muted-foreground/50" />}
              title="No webhooks configured yet. Create your first webhook to send events to external APIs."
              action={<Button onClick={() => setShowCreateWebhook(true)} size="sm">Create Webhook</Button>}
            />
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={() => setShowCreateWebhook(true)} size="sm">
                  Create Webhook
                </Button>
              </div>

              <AnimatedList>
                {webhooks.map((webhook) => (
                  <AnimatedItem key={webhook.id}>
                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium">{webhook.name}</h4>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">
                              {webhook.method}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted capitalize">
                              {webhook.auth_type === 'none' ? 'No Auth' : webhook.auth_type.replace('_', ' ')}
                            </span>
                            <SavedIndicator show={savedWebhookIds.has(webhook.id)} />
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate mb-2">
                            {webhook.url}
                          </p>
                          {webhook.events && webhook.events.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.map((event) => (
                                <span
                                  key={event}
                                  className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                                >
                                  {event}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={webhook.active ?? true}
                            onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestWebhook(webhook.id)}
                            className="text-xs"
                          >
                            <FlipBackward className="h-3.5 w-3.5 mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLogs(webhook.id)}
                            className="text-xs"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Logs
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingWebhook(webhook)}
                          >
                            <Edit03 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setWebhookToDelete(webhook.id)}
                          >
                            <Trash01 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AnimatedItem>
                ))}
              </AnimatedList>
            </>
          )}

          <CreateWebhookDialog
            open={showCreateWebhook}
            onOpenChange={setShowCreateWebhook}
            agentId={agentId}
          />

          <EditWebhookDialog
            open={!!editingWebhook}
            onOpenChange={(open) => !open && setEditingWebhook(null)}
            webhook={editingWebhook}
            onSave={handleUpdateWebhook}
          />

          {selectedWebhookForLogs && (
            <WebhookLogsDialog
              open={showLogsDialog}
              onOpenChange={setShowLogsDialog}
              webhookId={selectedWebhookForLogs}
            />
          )}

          <SimpleDeleteDialog
            open={!!webhookToDelete}
            onOpenChange={() => setWebhookToDelete(null)}
            title="Delete Webhook?"
            description="This will permanently delete this webhook and all its logs. This action cannot be undone."
            onConfirm={handleDeleteWebhook}
          />
        </div>
      )}

      {/* Debug Console - shown when debug mode is enabled */}
      {debugMode && (
        <DebugConsole
          logs={debugLogs}
          onClear={clearDebugLogs}
          className="mt-6"
        />
      )}

      <ApiUseCasesModal
        open={showUseCasesModal}
        onOpenChange={setShowUseCasesModal}
        agentId={agentId}
        apiEndpoint={apiEndpoint}
      />
    </AgentSettingsLayout>
  );
};