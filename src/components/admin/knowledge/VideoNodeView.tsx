/**
 * VideoNodeView - React NodeView for video embeds in the editor
 * 
 * Renders the VideoEmbed component with edit/delete controls.
 * 
 * @module components/admin/knowledge/VideoNodeView
 */

import { useState } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { HelpCenterVideoPlayer } from '@/components/help-center/HelpCenterVideoPlayer';
import { IconButton } from '@/components/ui/icon-button';
import { Edit03, Trash01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { VideoInputDialog } from './VideoInputDialog';
import { deleteVideoThumbnail } from '@/lib/video-thumbnail-upload';
import { useAuth } from '@/hooks/useAuth';

export function VideoNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { src, title, thumbnail } = node.attrs;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { user } = useAuth();

  const handleEditSubmit = (newUrl: string, thumbnailUrl?: string) => {
    if (!newUrl) {
      // If removing video, also delete the thumbnail from storage
      if (thumbnail) {
        deleteVideoThumbnail(thumbnail);
      }
      deleteNode();
      return;
    }
    
    // Store direct URL for self-hosted videos
    updateAttributes({
      src: newUrl,
      videoType: 'self-hosted',
      thumbnail: thumbnailUrl ?? thumbnail ?? '',
    });
  };

  const handleDelete = async () => {
    // Delete thumbnail from storage if it exists
    if (thumbnail) {
      await deleteVideoThumbnail(thumbnail);
    }
    deleteNode();
  };

  return (
    <NodeViewWrapper className="video-node-wrapper my-4">
      <div 
        className={cn(
          'relative group',
          selected && 'ring-2 ring-ring ring-offset-2 rounded-lg'
        )}
      >
        {/* Video player */}
        <HelpCenterVideoPlayer
          src={src}
          title={title}
          thumbnail={thumbnail}
        />

        {/* Action buttons - visible on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <IconButton
            variant="secondary"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            label="Edit video URL"
            className="bg-background/90 backdrop-blur-sm shadow-sm"
          >
            <Edit03 size={14} aria-hidden="true" />
          </IconButton>
          <IconButton
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            label="Remove video"
            className="bg-background/90 backdrop-blur-sm shadow-sm"
          >
            <Trash01 size={14} aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* Edit dialog */}
      <VideoInputDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialUrl={src}
        initialThumbnail={thumbnail}
        onSubmit={handleEditSubmit}
        userId={user?.id || ''}
      />
    </NodeViewWrapper>
  );
}
