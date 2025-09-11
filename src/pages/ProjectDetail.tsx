import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const ProjectDetail = () => {
  const { clientId, projectId } = useParams<{ clientId: string; projectId: string }>();

  return (
    <div className="flex h-screen bg-muted/30">
      <div className="flex-1 overflow-auto min-h-screen">
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <div className="w-full px-4 lg:px-8">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-4">Project Detail</h1>
                <p className="text-muted-foreground">
                  Project detail page for client {clientId}, project {projectId}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will be implemented with full project management functionality including tasks, timeline, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;