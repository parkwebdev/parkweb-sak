import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MessageChatSquare, 
  Users01 as Users, 
  BarChart01 as BarChart,
  Settings01 as Settings
} from '@untitledui/icons';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Create Agent',
      icon: Plus,
      onClick: () => navigate('/agents'),
      variant: 'default' as const
    },
    {
      label: 'View Conversations',
      icon: MessageChatSquare,
      onClick: () => navigate('/conversations'),
      variant: 'outline' as const
    },
    {
      label: 'Manage Leads',
      icon: Users,
      onClick: () => navigate('/leads'),
      variant: 'outline' as const
    },
    {
      label: 'Analytics',
      icon: BarChart,
      onClick: () => navigate('/analytics'),
      variant: 'outline' as const
    },
  ];

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              className="gap-2"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
