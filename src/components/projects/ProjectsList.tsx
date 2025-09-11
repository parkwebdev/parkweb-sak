import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from '@/hooks/useProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckSquare } from '@untitledui/icons';

interface ProjectsListProps {
  projects: Project[];
  loading: boolean;
  clientId: string;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ projects, loading, clientId }) => {
  const navigate = useNavigate();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'planning': return 'secondary';
      case 'active': return 'default';
      case 'on_hold': return 'outline';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'destructive';
      case 'urgent': return 'destructive';
      default: return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            📋
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
          <p className="text-muted-foreground">
            Create your first project to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card 
            key={project.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/clients/${clientId}/projects/${project.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                <div className="flex flex-col gap-1">
                  <Badge variant={getStatusVariant(project.status)} className="text-xs">
                    {project.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={getPriorityVariant(project.priority)} className="text-xs">
                    {project.priority}
                  </Badge>
                </div>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckSquare size={16} className="text-muted-foreground" />
                  <span>{project.task_count || 0} tasks</span>
                </div>
                {project.due_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={16} />
                    <span>Due {formatDate(project.due_date)}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Created {formatDate(project.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};