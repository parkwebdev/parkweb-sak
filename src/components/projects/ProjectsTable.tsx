import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Project } from '@/hooks/useProjects';
import { Eye, Edit01 as Edit, Trash01 as Trash } from '@untitledui/icons';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsVertical } from '@untitledui/icons';

interface ProjectsTableProps {
  projects: Project[];
  loading: boolean;
  clientId: string;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({ projects, loading, clientId }) => {
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
    return <div className="flex items-center justify-center p-8 text-muted-foreground">Loading projects...</div>;
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
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead>Project Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow 
              key={project.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/clients/${clientId}/projects/${project.id}`)}
            >
              <TableCell>
                <div>
                  <div className="font-medium text-foreground">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {project.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityVariant(project.priority)}>
                  {project.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium">{project.task_count || 0}</span>
                <span className="text-muted-foreground"> tasks</span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(project.due_date)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <DotsVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/clients/${clientId}/projects/${project.id}`)}>
                      <Eye size={16} className="mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                      <Edit size={16} className="mr-2" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}} className="text-red-600">
                      <Trash size={16} className="mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};