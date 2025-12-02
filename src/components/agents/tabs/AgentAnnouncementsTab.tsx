import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAnnouncements, type Announcement, type AnnouncementInsert } from '@/hooks/useAnnouncements';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash01, Edit02, Image03, ChevronRight } from '@untitledui/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { SavedIndicator } from '@/components/settings/SavedIndicator';

interface AnnouncementFormData {
  title: string;
  subtitle: string;
  image_url: string;
  title_color: string;
  background_color: string;
  action_type: 'open_url' | 'start_chat' | 'open_help';
  action_url: string;
  is_active: boolean;
}

const SortableAnnouncementCard = ({ announcement, onEdit, onDelete }: {
  announcement: Announcement;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: announcement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div {...attributes} {...listeners} className="flex-shrink-0">
              {announcement.image_url ? (
                <img 
                  src={announcement.image_url} 
                  alt="" 
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                  <Image03 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0" {...attributes} {...listeners}>
                  <h3 
                    className="font-semibold text-base truncate"
                    style={{ color: announcement.title_color }}
                  >
                    {announcement.title}
                  </h3>
                  {announcement.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {announcement.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      announcement.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {announcement.action_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit02 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash01 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AnnouncementDialog = ({ 
  announcement, 
  onSave, 
  onClose,
  open,
}: { 
  announcement?: Announcement;
  onSave: (data: AnnouncementFormData) => void;
  onClose: () => void;
  open: boolean;
}) => {
  const [formData, setFormData] = useState<AnnouncementFormData>(
    announcement ? {
      title: announcement.title,
      subtitle: announcement.subtitle || '',
      image_url: announcement.image_url || '',
      title_color: announcement.title_color,
      background_color: announcement.background_color,
      action_type: announcement.action_type as 'open_url' | 'start_chat' | 'open_help',
      action_url: announcement.action_url || '',
      is_active: announcement.is_active,
    } : {
      title: '',
      subtitle: '',
      image_url: '',
      title_color: '#2563eb',
      background_color: '#f8fafc',
      action_type: 'open_url',
      action_url: '',
      is_active: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{announcement ? 'Edit' : 'Create'} Announcement</DialogTitle>
          <DialogDescription>
            Configure how this announcement appears in your chat widget
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="New Feature Available"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Check out our latest updates and improvements"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_color">Title Color</Label>
              <div className="flex gap-2">
                <Input
                  id="title_color"
                  type="color"
                  value={formData.title_color}
                  onChange={(e) => setFormData({ ...formData, title_color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.title_color}
                  onChange={(e) => setFormData({ ...formData, title_color: e.target.value })}
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background_color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  placeholder="#f8fafc"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_type">Action Type</Label>
            <Select
              value={formData.action_type}
              onValueChange={(value: 'open_url' | 'start_chat' | 'open_help') => 
                setFormData({ ...formData, action_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open_url">Open URL</SelectItem>
                <SelectItem value="start_chat">Start Chat</SelectItem>
                <SelectItem value="open_help">Open Help Center</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.action_type === 'open_url' && (
            <div className="space-y-2">
              <Label htmlFor="action_url">Action URL</Label>
              <Input
                id="action_url"
                type="url"
                value={formData.action_url}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                placeholder="https://example.com/feature"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Show this announcement in the chat widget
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div 
              className="rounded-lg overflow-hidden border"
              style={{ backgroundColor: formData.background_color }}
            >
              {formData.image_url && (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={formData.image_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 
                    className="font-semibold text-base"
                    style={{ color: formData.title_color }}
                  >
                    {formData.title || 'Announcement Title'}
                  </h3>
                  {formData.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.subtitle}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {announcement ? 'Save Changes' : 'Create Announcement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AgentAnnouncementsTab = () => {
  const { agentId } = useParams();
  const { user } = useAuth();
  const { announcements, loading, addAnnouncement, updateAnnouncement, deleteAnnouncement, reorderAnnouncements } = useAnnouncements(agentId!);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = announcements.findIndex((a) => a.id === active.id);
      const newIndex = announcements.findIndex((a) => a.id === over.id);
      const reordered = arrayMove(announcements, oldIndex, newIndex);
      await reorderAnnouncements(reordered);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleSave = async (formData: AnnouncementFormData) => {
    if (editingAnnouncement) {
      await updateAnnouncement(editingAnnouncement.id, formData);
    } else {
      const newAnnouncement: AnnouncementInsert = {
        ...formData,
        agent_id: agentId!,
        user_id: user!.id,
        order_index: announcements.length,
      };
      await addAnnouncement(newAnnouncement);
    }
    // Reset state after save
    setEditingAnnouncement(null);
    setIsCreateDialogOpen(false);
  };

  if (loading) {
    return <div className="p-6">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">Announcements</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage announcements displayed in your chat widget
            </p>
          </div>
          <SavedIndicator show={showSaved} message="Order saved" />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No announcements yet</CardTitle>
            <CardDescription>
              Create your first announcement to engage with your users
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={announcements.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <SortableAnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={() => setEditingAnnouncement(announcement)}
                  onDelete={() => setDeleteId(announcement.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AnnouncementDialog
        announcement={editingAnnouncement || undefined}
        onSave={handleSave}
        onClose={() => {
          setEditingAnnouncement(null);
          setIsCreateDialogOpen(false);
        }}
        open={!!editingAnnouncement || isCreateDialogOpen}
      />

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteAnnouncement(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action cannot be undone."
      />
    </div>
  );
};
