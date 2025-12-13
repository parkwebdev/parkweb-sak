/**
 * AriNewsSection
 * 
 * Full news items management with CRUD, drag-and-drop reordering,
 * rich text editor, featured images, author selection, and CTAs.
 */

import { useState, useRef, useEffect } from 'react';
import { useNewsItems, type NewsItem, type NewsItemInsert } from '@/hooks/useNewsItems';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { AriSectionHeader } from './AriSectionHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash01, Edit02, Image03, Upload01, XClose, Plus } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { uploadFeaturedImage, deleteArticleImage } from '@/lib/article-image-upload';
import { toast } from '@/lib/toast';
import { Spinner } from '@/components/ui/spinner';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';

interface AriNewsSectionProps {
  agentId: string;
  userId: string;
}

interface NewsFormData {
  title: string;
  featured_image_url: string;
  body: string;
  author_name: string;
  author_avatar: string;
  is_published: boolean;
  cta_primary_label: string;
  cta_primary_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
}

// Helper to format author name as "FirstName L."
const formatAuthorName = (displayName: string | null | undefined): string => {
  if (!displayName) return '';
  const parts = displayName.trim().split(' ');
  const firstName = parts[0] || '';
  const lastInitial = parts[1]?.[0] || '';
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
};

// Strip HTML tags for preview text
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const SortableNewsCard = ({ newsItem, onEdit, onDelete }: {
  newsItem: NewsItem;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: newsItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const previewText = stripHtml(newsItem.body).substring(0, 100);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div {...attributes} {...listeners} className="flex-shrink-0">
              {newsItem.featured_image_url ? (
                <img 
                  src={newsItem.featured_image_url} 
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
                    {newsItem.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {previewText}{previewText.length >= 100 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {newsItem.author_name && (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={newsItem.author_avatar || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {newsItem.author_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {newsItem.author_name}
                        </span>
                      </div>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      newsItem.is_published 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {newsItem.is_published ? 'Published' : 'Draft'}
                    </span>
                    {newsItem.published_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(newsItem.published_at), 'MMM d, yyyy')}
                      </span>
                    )}
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
                    aria-label={`Edit news item: ${newsItem.title}`}
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
                    aria-label={`Delete news item: ${newsItem.title}`}
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

const NewsDialog = ({ 
  newsItem, 
  onSave, 
  onClose,
  open,
  agentId,
  userId,
}: { 
  newsItem?: NewsItem;
  onSave: (data: NewsFormData) => void;
  onClose: () => void;
  open: boolean;
  agentId: string;
  userId: string;
}) => {
  const { teamMembers } = useTeam();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(newsItem?.featured_image_url || null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(newsItem?.featured_image_url || null);
  
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    featured_image_url: '',
    body: '',
    author_name: '',
    author_avatar: '',
    is_published: false,
    cta_primary_label: '',
    cta_primary_url: '',
    cta_secondary_label: '',
    cta_secondary_url: '',
  });

  useEffect(() => {
    if (newsItem) {
      setFormData({
        title: newsItem.title,
        featured_image_url: newsItem.featured_image_url || '',
        body: newsItem.body,
        author_name: newsItem.author_name || '',
        author_avatar: newsItem.author_avatar || '',
        is_published: newsItem.is_published ?? false,
        cta_primary_label: newsItem.cta_primary_label || '',
        cta_primary_url: newsItem.cta_primary_url || '',
        cta_secondary_label: newsItem.cta_secondary_label || '',
        cta_secondary_url: newsItem.cta_secondary_url || '',
      });
      setImagePreview(newsItem.featured_image_url || null);
      setOriginalImageUrl(newsItem.featured_image_url || null);
    } else {
      setFormData({
        title: '',
        featured_image_url: '',
        body: '',
        author_name: '',
        author_avatar: '',
        is_published: false,
        cta_primary_label: '',
        cta_primary_url: '',
        cta_secondary_label: '',
        cta_secondary_url: '',
      });
      setImagePreview(null);
      setOriginalImageUrl(null);
    }
    setImageFile(null);
  }, [newsItem]);

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
    setFormData({ ...formData, featured_image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAuthorSelect = (memberUserId: string) => {
    const member = teamMembers.find(m => m.user_id === memberUserId);
    if (member) {
      setFormData({
        ...formData,
        author_name: formatAuthorName(member.display_name),
        author_avatar: member.avatar_url || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      let finalImageUrl = formData.featured_image_url;
      
      if (imageFile) {
        finalImageUrl = await uploadFeaturedImage(imageFile, userId, agentId);
        
        if (originalImageUrl && originalImageUrl !== finalImageUrl) {
          await deleteArticleImage(originalImageUrl);
        }
      } else if (!imagePreview && originalImageUrl) {
        await deleteArticleImage(originalImageUrl);
        finalImageUrl = '';
      }
      
      onSave({ ...formData, featured_image_url: finalImageUrl });
      onClose();
    } catch (error) {
      logger.error('Error saving news item:', error);
      toast.error('Failed to save news item');
    } finally {
      setIsUploading(false);
    }
  };

  const currentAuthorMember = teamMembers.find(
    m => formatAuthorName(m.display_name) === formData.author_name
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{newsItem ? 'Edit' : 'Create'} News Item</DialogTitle>
          <DialogDescription>
            Create a blog-style update to share with your users
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="news-title">Title *</Label>
            <Input
              id="news-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Introducing Our New Feature"
              required
            />
          </div>

          {/* Featured Image Upload */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted">
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
              <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <Upload01 className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload featured image</span>
                <span className="text-xs text-muted-foreground mt-1">Recommended: 1200×600</span>
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

          {/* Rich Text Editor for Body */}
          <div className="space-y-2">
            <Label>Content *</Label>
            <RichTextEditor
              content={formData.body}
              onChange={(html) => setFormData({ ...formData, body: html })}
              placeholder="Write your news article content here..."
              agentId={agentId}
              userId={userId}
              minHeight="200px"
            />
          </div>

          {/* Author Selection */}
          <div className="space-y-2">
            <Label>Author</Label>
            <Select
              value={currentAuthorMember?.user_id || ''}
              onValueChange={handleAuthorSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an author">
                  {currentAuthorMember ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={currentAuthorMember.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {currentAuthorMember.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{formatAuthorName(currentAuthorMember.display_name)}</span>
                    </div>
                  ) : formData.author_name ? (
                    <span>{formData.author_name}</span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {member.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{formatAuthorName(member.display_name)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Call to Action Buttons */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Call to Action Buttons</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Primary CTA */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-sm font-medium">Primary Button</Label>
                <div className="space-y-2">
                  <Input
                    value={formData.cta_primary_label}
                    onChange={(e) => setFormData({ ...formData, cta_primary_label: e.target.value })}
                    placeholder="Button label"
                  />
                  <Input
                    value={formData.cta_primary_url}
                    onChange={(e) => setFormData({ ...formData, cta_primary_url: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>
              {/* Secondary CTA */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-sm font-medium">Secondary Button</Label>
                <div className="space-y-2">
                  <Input
                    value={formData.cta_secondary_label}
                    onChange={(e) => setFormData({ ...formData, cta_secondary_label: e.target.value })}
                    placeholder="Button label"
                  />
                  <Input
                    value={formData.cta_secondary_url}
                    onChange={(e) => setFormData({ ...formData, cta_secondary_url: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Both label and URL are required for a button to appear
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_published">Published</Label>
              <p className="text-sm text-muted-foreground">
                Make this news item visible to users
              </p>
            </div>
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading && <Spinner className="mr-2 h-4 w-4" />}
              {newsItem ? 'Save Changes' : 'Create News Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AriNewsSection: React.FC<AriNewsSectionProps> = ({ agentId, userId }) => {
  const { newsItems, loading, addNewsItem, updateNewsItem, deleteNewsItem, reorderNewsItems } = useNewsItems(agentId);
  
  const [editingNewsItem, setEditingNewsItem] = useState<NewsItem | null>(null);
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
      const oldIndex = newsItems.findIndex((n) => n.id === active.id);
      const newIndex = newsItems.findIndex((n) => n.id === over.id);
      const reordered = arrayMove(newsItems, oldIndex, newIndex);
      await reorderNewsItems(reordered);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleSave = async (formData: NewsFormData) => {
    if (editingNewsItem) {
      await updateNewsItem(editingNewsItem.id, {
        ...formData,
        published_at: formData.is_published ? new Date().toISOString() : null,
      });
    } else {
      const newNewsItem: NewsItemInsert = {
        ...formData,
        agent_id: agentId,
        user_id: userId,
        order_index: newsItems.length,
        published_at: formData.is_published ? new Date().toISOString() : null,
      };
      await addNewsItem(newNewsItem);
    }
    setEditingNewsItem(null);
    setIsCreateOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteNewsItem(deleteId);
    setDeleteId(null);
    setDeleteConfirmation('');
  };

  return (
    <div>
      <AriSectionHeader
        title="News"
        description="Blog-style updates and articles for your users"
        extra={
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add News Item
          </Button>
        }
      />

      <div className="mt-6 space-y-4">
        <SavedIndicator show={showSaved} message="Order saved" />

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading news...</div>
        ) : newsItems.length === 0 ? (
          <EmptyState
            icon={<Image03 className="h-5 w-5 text-muted-foreground/50" />}
            title="No news items yet"
            description="Create your first news article to keep users informed."
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={newsItems.map(n => n.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {newsItems.map((newsItem) => (
                  <SortableNewsCard
                    key={newsItem.id}
                    newsItem={newsItem}
                    onEdit={() => setEditingNewsItem(newsItem)}
                    onDelete={() => setDeleteId(newsItem.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <NewsDialog
        newsItem={editingNewsItem || undefined}
        onSave={handleSave}
        onClose={() => {
          setEditingNewsItem(null);
          setIsCreateOpen(false);
        }}
        open={!!editingNewsItem || isCreateOpen}
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
        title="Delete News Item"
        description={'Are you sure you want to delete this news item? Type "DELETE" to confirm.'}
        confirmationText="DELETE"
        isDeleting={false}
      />
    </div>
  );
};
