import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RequestsTable } from "./RequestsTable";
import { RequestKanbanView } from "./RequestKanbanView";
import { CreateRequestLinkDialog } from "./CreateRequestLinkDialog";
import { LayoutGrid01 as LayoutGrid, Table, Menu01 as Menu } from "@untitledui/icons";

export const RequestsContent = () => {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check for 'open' parameter to auto-open a request
  const openRequestId = searchParams.get('open');
  
  useEffect(() => {
    // Clear the URL parameter after checking it to avoid keeping it in the URL
    if (openRequestId) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('open');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [openRequestId, searchParams, setSearchParams]);

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-sm font-semibold text-foreground">Requests</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage client website change requests and track their progress
                </p>
              </div>
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
              <Button 
                onClick={() => setShowCreateDialog(true)}
                size="sm"
                className="h-8 px-3 text-sm"
              >
                Create Client Link
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="w-full mt-6">
        <div className="w-full px-4 lg:px-8 py-0">
          {viewMode === "table" ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <RequestsTable openRequestId={openRequestId} />
              </CardContent>
            </Card>
          ) : (
            <RequestKanbanView openRequestId={openRequestId} />
          )}
        </div>
      </section>

      <CreateRequestLinkDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </main>
  );
};