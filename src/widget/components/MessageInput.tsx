import { Suspense, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send01, Microphone01, Attachment01, X, FileCheck02, FaceSmile } from '@untitledui/icons';
import { VoiceInput } from '../constants';

interface PendingFile {
  file: File;
  preview: string;
}

interface MessageInputProps {
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled: boolean;
  primaryColor: string;
  enableFileAttachments: boolean;
  enableVoiceMessages: boolean;
  isRecordingAudio: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onAttachFiles: () => void;
  pendingFiles: PendingFile[];
  onRemoveFile: (index: number) => void;
}

const QUICK_EMOJIS = ['😊', '👍', '❤️', '😂', '🎉', '👋', '🙏', '✨'];

export const MessageInput = ({
  messageInput,
  onMessageChange,
  onSend,
  placeholder,
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
  const [emojiOpen, setEmojiOpen] = useState(false);

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

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = messageInput.slice(0, start) + emoji + messageInput.slice(end);
      onMessageChange(newValue);
      // Restore cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      onMessageChange(messageInput + emoji);
    }
    setEmojiOpen(false);
  };

  return (
    <div className="border-t">
      {pendingFiles.length > 0 && (
        <div className="p-2 flex gap-2 overflow-x-auto">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative group flex-shrink-0">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                {pf.preview ? (
                  <img src={pf.preview} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <FileCheck02 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button 
                  size="icon"
                  variant="destructive"
                  onClick={() => onRemoveFile(i)} 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
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
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <Button 
                  type="button"
                  size="icon" 
                  variant="ghost" 
                  disabled={disabled}
                  className="h-8 w-8 shrink-0"
                >
                  <FaceSmile className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-2" 
                side="top" 
                align="start"
                sideOffset={8}
              >
                <div className="flex gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-lg p-1 hover:bg-muted rounded transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {enableFileAttachments && (
              <Button 
                type="button"
                size="icon" 
                variant="ghost" 
                onClick={onAttachFiles}
                disabled={disabled}
                className={`h-8 w-8 shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Attachment01 className="h-4 w-4" />
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
              >
                <Microphone01 className="h-4 w-4" />
              </Button>
            )}
            
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={messageInput}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={`min-h-[36px] max-h-[120px] py-2 pr-10 text-sm placeholder:text-xs resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <Button 
                type="button"
                size="icon" 
                className="absolute right-1 bottom-1 h-7 w-7"
                onClick={onSend} 
                disabled={disabled || !messageInput.trim()}
                style={{ backgroundColor: primaryColor }}
              >
                <Send01 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
