/**
 * @fileoverview Dialog for managing custom lead pipeline stages.
 * Provides CRUD, reordering, and color customization.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';
import { useLeadStages, LeadStage } from '@/hooks/useLeadStages';
import { Plus, Trash01, Check, DotsGrid } from '@untitledui/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface ManageStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined color options
const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#10b981', // emerald
  '#16a34a', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#6b7280', // gray
  '#06b6d4', // cyan
  '#8b5cf6', // violet
];

// Sortable stage item
function SortableStageItem({
  stage,
  onUpdate,
  onDelete,
  isDeleting,
}: {
  stage: LeadStage;
  onUpdate: (id: string, updates: Partial<Pick<LeadStage, 'name' | 'color' | 'is_default'>>) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stage.name);
  const [showColors, setShowColors] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleNameSave = useCallback(() => {
    if (editName.trim() && editName !== stage.name) {
      onUpdate(stage.id, { name: editName.trim() });
    }
    setIsEditing(false);
  }, [editName, stage.id, stage.name, onUpdate]);

  const handleColorChange = useCallback((color: string) => {
    onUpdate(stage.id, { color });
    setShowColors(false);
  }, [stage.id, onUpdate]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-3 bg-card border rounded-lg',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder stage"
      >
        <DotsGrid size={16} />
      </button>

      {/* Color picker */}
      <div className="relative">
        <button
          onClick={() => setShowColors(!showColors)}
          className="w-5 h-5 rounded-full border-2 border-background shadow-sm"
          style={{ backgroundColor: stage.color }}
          aria-label={`Select color for ${stage.name}`}
        />
        {showColors && (
          <div className="absolute left-0 top-8 z-50 p-2 bg-popover border rounded-lg shadow-lg grid grid-cols-5 gap-1">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform',
                  stage.color === color ? 'border-foreground' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color} color`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Name input/display */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave();
              if (e.key === 'Escape') {
                setEditName(stage.name);
                setIsEditing(false);
              }
            }}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-left w-full truncate hover:text-primary"
          >
            {stage.name}
          </button>
        )}
      </div>

      {/* Default badge */}
      {stage.is_default && (
        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
          Default
        </span>
      )}

      {/* Set as default button */}
      {!stage.is_default && (
        <IconButton
          label="Set as default"
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(stage.id, { is_default: true })}
        >
          <Check size={14} />
        </IconButton>
      )}

      {/* Delete button */}
      <IconButton
        label="Delete stage"
        variant="ghost"
        size="sm"
        onClick={() => onDelete(stage.id)}
        disabled={isDeleting}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash01 size={14} />
      </IconButton>
    </div>
  );
}

export function ManageStagesDialog({ open, onOpenChange }: ManageStagesDialogProps) {
  const { stages, createStage, updateStage, deleteStage, reorderStages, loading } = useLeadStages();
  const [localStages, setLocalStages] = useState<LeadStage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Sync local stages with hook data
  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localStages.findIndex((s) => s.id === active.id);
      const newIndex = localStages.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(localStages, oldIndex, newIndex);
      setLocalStages(newOrder);

      // Persist the new order
      await reorderStages(newOrder.map((s) => s.id));
    }
  }, [localStages, reorderStages]);

  const handleCreateStage = useCallback(async () => {
    if (!newStageName.trim()) return;

    setIsCreating(true);
    try {
      await createStage(newStageName.trim());
      setNewStageName('');
    } finally {
      setIsCreating(false);
    }
  }, [newStageName, createStage]);

  const handleDeleteStage = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteStage(id);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Pipeline Stages</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localStages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localStages.map((stage) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      onUpdate={updateStage}
                      onDelete={handleDeleteStage}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Add new stage */}
        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="New stage name..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateStage();
            }}
            className="flex-1"
          />
          <Button
            onClick={handleCreateStage}
            disabled={!newStageName.trim() || isCreating}
            size="sm"
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
