import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchLg, Menu01 as Menu, Rocket01 } from '@untitledui/icons';
import { useAgents } from '@/hooks/useAgents';
import { CreateAgentDialog } from '@/components/agents/CreateAgentDialog';
import { AgentCard } from '@/components/agents/AgentCard';
import type { Tables } from '@/integrations/supabase/types';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

type Agent = Tables<'agents'>;

interface AgentsProps {
  onMenuClick?: () => void;
}

const Agents: React.FC<AgentsProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { agents, loading, createAgent, updateAgent, deleteAgent } = useAgents();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, status: 'draft' | 'active' | 'paused') => {
    await updateAgent(id, { status });
  };

  return (
    <main className="flex-1 bg-muted/30 h-screen overflow-auto">
      <header className="w-full font-medium pt-4 lg:pt-8">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-2xl font-bold text-foreground">Agents</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage AI agents
                </p>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Create Agent
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 mt-6 space-y-6">

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading agents...
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12 px-8 rounded-lg border border-dashed bg-muted/30">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Rocket01 className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'No agents match your filters' 
                : 'No agents created yet'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                Create Your First Agent
              </Button>
            )}
          </div>
        ) : (
          <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
            {filteredAgents.map((agent) => (
              <AnimatedItem key={agent.id}>
                <AgentCard
                  agent={agent}
                  onEdit={() => {}}
                  onDelete={deleteAgent}
                  onStatusChange={handleStatusChange}
                />
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}

        <CreateAgentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={createAgent}
        />
      </div>
    </main>
  );
};

export default Agents;
