/**
 * MessageInput Component
 * 
 * Chat input area with auto-resizing textarea, emoji picker, file attachments,
 * voice recording, and send button. Supports keyboard shortcuts (Enter to send).
 * 
 * @module widget/components/MessageInput
 */

import { Suspense, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send01, Microphone01, Attachment01, X } from '../icons';
import { VoiceInput } from '../constants';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';

/** Pending file attachment with preview URL */
interface PendingFile {
  /** Original file object */
  file: File;
  /** Preview URL (data URL or object URL) */
  preview: string;
}

/** Props for the MessageInput component */
interface MessageInputProps {
  /** Current input value */
  messageInput: string;
  /** Input change handler */
  onMessageChange: (value: string) => void;
  /** Send button click handler */
  onSend: () => void;
  /** Whether input is disabled */
  disabled: boolean;
  /** Primary brand color for send button */
  primaryColor: string;
  /** Whether file attachments are enabled */
  enableFileAttachments: boolean;
  /** Whether voice messages are enabled */
  enableVoiceMessages: boolean;
  /** Whether currently recording audio */
  isRecordingAudio: boolean;
  /** Current recording duration in seconds */
  recordingTime: number;
  /** Start recording handler */
  onStartRecording: () => void;
  /** Stop recording handler (sends message) */
  onStopRecording: () => void;
  /** Cancel recording handler */
  onCancelRecording: () => void;
  /** Attach files button handler */
  onAttachFiles: () => void;
  /** Currently pending file attachments */
  pendingFiles: PendingFile[];
  /** Remove pending file handler */
  onRemoveFile: (index: number) => void;
}


/**
 * Chat input component with rich input features.
 * 
 * @param props - Component props
 * @returns Input area with textarea and action buttons
 */
export const MessageInput = ({
  messageInput,
  onMessageChange,
  onSend,
  disabled,
  primaryColor,
  enableFileAttachments,
  enableVoiceMessages,
  isRecordingAudio,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onAttachFiles,
  pendingFiles,
  onRemoveFile,
}: MessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const minHeight = 36; // Single line
    const maxHeight = 120; // ~5 lines
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [messageInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t">
      {pendingFiles.length > 0 && (
        <div className="p-2 flex gap-2 overflow-x-auto">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative group flex-shrink-0">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border flex items-center justify-center bg-muted">
                {pf.file.type.startsWith('image/') ? (
                  <img src={pf.preview} className="w-full h-full object-cover" alt={pf.file.name} />
                ) : (
                  <FileTypeIcon fileName={pf.file.name} width={32} height={32} />
                )}
                <Button 
                  size="icon"
                  variant="destructive"
                  onClick={() => onRemoveFile(i)} 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${pf.file.name}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="p-3">
        {isRecordingAudio ? (
          <div className="flex items-center justify-center gap-3">
            <Suspense fallback={<div className="h-12 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}>
              <VoiceInput
                isRecording={isRecordingAudio}
                recordingTime={recordingTime}
                onStop={onStopRecording}
                onCancel={onCancelRecording}
              />
            </Suspense>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            {enableFileAttachments && (
              <Button 
                type="button"
                size="icon" 
                variant="ghost" 
                onClick={onAttachFiles}
                disabled={disabled}
                className={`h-8 w-8 shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Attach file"
              >
                <Attachment01 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {enableVoiceMessages && (
              <Button 
                type="button"
                size="icon" 
                variant="ghost" 
                onClick={onStartRecording}
                disabled={disabled}
                className={`h-8 w-8 shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Record voice message"
              >
                <Microphone01 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={messageInput}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing..."
                disabled={disabled}
                rows={1}
                className={`min-h-[36px] max-h-[120px] py-2 pr-10 text-sm placeholder:text-xs resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <Button 
                type="button"
                size="icon" 
                className="absolute right-1 bottom-1 h-7 w-7 bg-foreground text-background hover:bg-foreground/90"
                onClick={onSend} 
                disabled={disabled || !messageInput.trim()}
                aria-label="Send message"
              >
                <Send01 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
