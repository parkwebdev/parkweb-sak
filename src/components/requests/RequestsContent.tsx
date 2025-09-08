import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "./RequestsTable";
import { RequestKanbanView } from "./RequestKanbanView";
import { CreateRequestLinkDialog } from "./CreateRequestLinkDialog";
import { Plus, LayoutGrid01 as LayoutGrid, Table } from "@untitledui/icons";

export const RequestsContent = () => {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">Manage client website change requests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-2"
            >
              <Table size={16} />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-8 px-2"
            >
              <LayoutGrid size={16} />
            </Button>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} className="mr-2" />
            Create Client Link
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Requests</CardTitle>
          <CardDescription>
            Track and manage website change requests from your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <RequestsTable />
          ) : (
            <RequestKanbanView />
          )}
        </CardContent>
      </Card>

      <CreateRequestLinkDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};