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

export function VideoNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { src, videoType, title, thumbnail } = node.attrs;
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditSubmit = (newUrl: string) => {
    if (!newUrl) {
      deleteNode();
      return;
    }
    
    // Store direct URL for self-hosted videos
    updateAttributes({
      src: newUrl,
      videoType: 'self-hosted',
      thumbnail: '',
    });
  };

  const handleDelete = () => {
    deleteNode();
  };

  return (
    <NodeViewWrapper className="video-node-wrapper">
      <div 
        className={cn(
          'relative group rounded-lg overflow-hidden',
          selected && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        {/* Video player */}
        <HelpCenterVideoPlayer
          src={src}
          title={title}
          thumbnail={thumbnail}
        />

        {/* Action buttons - visible on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        onSubmit={handleEditSubmit}
      />
    </NodeViewWrapper>
  );
}
