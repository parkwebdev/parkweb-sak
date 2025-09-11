import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientsTable } from "./ClientsTable";
import { ClientsList } from "./ClientsList";
import { CreateClientDialog } from "./CreateClientDialog";
import { LayoutGrid01 as LayoutGrid, Table, Menu01 as Menu, Plus } from "@untitledui/icons";
import { useClients } from "@/hooks/useClients";

export const ClientsContent = () => {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { refetch } = useClients();

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
                <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Clients</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your client relationships and track all projects
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
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
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
                Add Client
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
                <ClientsTable />
              </CardContent>
            </Card>
          ) : (
            <ClientsList />
          )}
        </div>
      </section>

      <CreateClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onClientCreated={refetch}
      />
    </main>
  );
};