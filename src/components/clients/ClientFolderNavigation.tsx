import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Folder,
  Plus,
  Edit01 as Edit,
  Trash01 as Trash,
  ChevronRight,
  Home01 as Home
} from '@untitledui/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClientFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parent_id?: string;
  client_count: number;
  children?: ClientFolder[];
}

interface ClientFolderNavigationProps {
  currentFolder?: string | null;
  onFolderChange: (folderId: string | null) => void;
  clientCount: number;
}

export const ClientFolderNavigation: React.FC<ClientFolderNavigationProps> = ({
  currentFolder,
  onFolderChange,
  clientCount
}) => {
  const [folders, setFolders] = useState<ClientFolder[]>([
    {
      id: '1',
      name: 'High Priority',
      description: 'Important clients requiring immediate attention',
      color: '#ef4444',
      client_count: 5
    },
    {
      id: '2',
      name: 'E-commerce',
      description: 'Online retail clients',
      color: '#3b82f6',
      client_count: 8
    },
    {
      id: '3',
      name: 'Healthcare',
      description: 'Medical and healthcare clients',
      color: '#10b981',
      client_count: 3
    }
  ]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: ClientFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      description: newFolderDescription,
      color: newFolderColor,
      client_count: 0
    };

    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setNewFolderDescription('');
    setNewFolderColor('#6366f1');
    setShowCreateDialog(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter(f => f.id !== folderId));
    if (currentFolder === folderId) {
      onFolderChange(null);
    }
  };

  const breadcrumbs = [];
  if (currentFolder) {
    const folder = folders.find(f => f.id === currentFolder);
    if (folder) {
      breadcrumbs.push(folder);
    }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <button
          onClick={() => onFolderChange(null)}
          className={`flex items-center gap-1 hover:text-foreground transition-colors ${
            !currentFolder ? 'text-foreground font-medium' : ''
          }`}
        >
          <Home size={14} />
          All Clients
        </button>
        {breadcrumbs.map((folder) => (
          <React.Fragment key={folder.id}>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">{folder.name}</span>
          </React.Fragment>
        ))}
      </nav>

      {/* Folder List */}
      <div className="space-y-2">
        {/* All Clients */}
        <button
          onClick={() => onFolderChange(null)}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
            !currentFolder
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-card border-border hover:bg-accent/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Home size={16} />
            <span className="font-medium">All Clients</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {clientCount}
          </Badge>
        </button>

        {/* Custom Folders */}
        {folders.map((folder) => (
          <div key={folder.id} className="group relative">
            <button
              onClick={() => onFolderChange(folder.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                currentFolder === folder.id
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-card border-border hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: folder.color }}
                />
                <div className="text-left">
                  <div className="font-medium">{folder.name}</div>
                  {folder.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {folder.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {folder.client_count}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit size={12} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit size={14} className="mr-2" />
                      Edit Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteFolder(folder.id)}
                    >
                      <Trash size={14} className="mr-2" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </button>
          </div>
        ))}

        {/* Create New Folder */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
              <Plus size={16} />
              <span>Create New Folder</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Folder Name
                </label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description (Optional)
                </label>
                <Input
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="Brief description..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Color
                </label>
                <div className="flex gap-2">
                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newFolderColor === color ? 'border-foreground scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};