/**
 * AriAnnouncementsSection
 * 
 * Full announcements management with CRUD, drag-and-drop reordering,
 * image uploads, and color customization.
 */

import { useState, useRef, useEffect } from 'react';
import { useAnnouncements, type Announcement, type AnnouncementInsert } from '@/hooks/useAnnouncements';
import { useAuth } from '@/hooks/useAuth';
import { AriSectionHeader } from './AriSectionHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash01, Edit02, Image03, ChevronRight, Upload01, XClose, Plus } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { uploadAnnouncementImage, deleteAnnouncementImage } from '@/lib/announcement-image-upload';
import { toast } from '@/lib/toast';
import { Spinner } from '@/components/ui/spinner';
import { LoadingState } from '@/components/ui/loading-state';
import { logger } from '@/utils/logger';

interface AriAnnouncementsSectionProps {
  agentId: string;
  userId: string;
}

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
                  <h3 className="font-semibold text-base truncate">
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
                        ? 'bg-status-active/10 text-status-active-foreground dark:bg-status-active/20 dark:text-status-active' 
                        : 'bg-status-inactive/10 text-status-inactive-foreground dark:bg-status-inactive/20 dark:text-status-inactive'
                    }`}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {announcement.action_type?.replace('_', ' ') || 'open url'}
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
                    aria-label={`Edit announcement: ${announcement.title}`}
                  >
                    <Edit02 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    aria-label={`Delete announcement: ${announcement.title}`}
                  >
                    <Trash01 className="h-4 w-4 text-destructive" aria-hidden="true" />
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
  agentId,
  userId,
}: { 
  announcement?: Announcement;
  onSave: (data: AnnouncementFormData) => void;
  onClose: () => void;
  open: boolean;
  agentId: string;
  userId: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(announcement?.image_url || null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(announcement?.image_url || null);
  
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    subtitle: '',
    image_url: '',
    title_color: '#2563eb',
    background_color: '#f8fafc',
    action_type: 'open_url',
    action_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        subtitle: announcement.subtitle || '',
        image_url: announcement.image_url || '',
        title_color: announcement.title_color || '#2563eb',
        background_color: announcement.background_color || '#f8fafc',
        action_type: announcement.action_type as 'open_url' | 'start_chat' | 'open_help',
        action_url: announcement.action_url || '',
        is_active: announcement.is_active ?? true,
      });
      setImagePreview(announcement.image_url || null);
      setOriginalImageUrl(announcement.image_url || null);
    } else {
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        title_color: '#2563eb',
        background_color: '#f8fafc',
        action_type: 'open_url',
        action_url: '',
        is_active: true,
      });
      setImagePreview(null);
      setOriginalImageUrl(null);
    }
    setImageFile(null);
  }, [announcement]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      let finalImageUrl = formData.image_url;
      
      if (imageFile) {
        finalImageUrl = await uploadAnnouncementImage(imageFile, userId, agentId);
        
        if (originalImageUrl && originalImageUrl !== finalImageUrl) {
          await deleteAnnouncementImage(originalImageUrl);
        }
      } else if (!imagePreview && originalImageUrl) {
        await deleteAnnouncementImage(originalImageUrl);
        finalImageUrl = '';
      }
      
      onSave({ ...formData, image_url: finalImageUrl });
      onClose();
    } catch (error) {
      logger.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    } finally {
      setIsUploading(false);
    }
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
            <Label>Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  aria-label="Remove image"
                  onClick={handleRemoveImage}
                >
                  <XClose className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <Upload01 className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload</span>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
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
              {imagePreview && (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={imagePreview} 
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading && <Spinner className="mr-2 h-4 w-4" />}
              {announcement ? 'Save Changes' : 'Create Announcement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AriAnnouncementsSection: React.FC<AriAnnouncementsSectionProps> = ({ agentId, userId }) => {
  const { announcements, loading, addAnnouncement, updateAnnouncement, deleteAnnouncement, reorderAnnouncements } = useAnnouncements(agentId);
  
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
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
        agent_id: agentId,
        user_id: userId,
        order_index: announcements.length,
      };
      await addAnnouncement(newAnnouncement);
    }
    setEditingAnnouncement(null);
    setIsCreateOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAnnouncement(deleteId);
    setDeleteId(null);
    setDeleteConfirmation('');
  };

  return (
    <div>
      <AriSectionHeader
        title="Announcements"
        description="Promotional banners displayed at the top of your chat widget"
        extra={
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            Add Announcement
          </Button>
        }
      />

      <div className="mt-6 space-y-4">
        <SavedIndicator show={showSaved} message="Order saved" />

        {loading ? (
          <LoadingState text="Loading announcements..." />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={<Image03 className="h-5 w-5 text-muted-foreground/50" />}
            title="No announcements yet"
            description="Create your first announcement to engage with your users."
          />
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
      </div>

      <AnnouncementDialog
        announcement={editingAnnouncement || undefined}
        onSave={handleSave}
        onClose={() => {
          setEditingAnnouncement(null);
          setIsCreateOpen(false);
        }}
        open={!!editingAnnouncement || isCreateOpen}
        agentId={agentId}
        userId={userId}
      />

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setDeleteConfirmation('');
          }
        }}
        confirmationValue={deleteConfirmation}
        onConfirmationValueChange={setDeleteConfirmation}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description={'Are you sure you want to delete this announcement? Type "DELETE" to confirm.'}
        confirmationText="DELETE"
        isDeleting={false}
      />
    </div>
  );
};
