/**
 * MessageInputArea Component
 * 
 * Message input form for human takeover mode.
 * Includes emoji picker, file attachments, translation button,
 * and auto-resizing textarea with send button.
 * 
 * @component
 */

import React, { memo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Send01, Attachment01, XClose, Translate01 } from '@untitledui/icons';
import { QuickEmojiButton } from '@/components/chat/QuickEmojiButton';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { getLanguageFlag } from '@/lib/language-utils';

export interface MessageInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pendingFiles: { files: File[]; urls: string[] } | null;
  onRemoveFile: (index: number) => void;
  isSending: boolean;
  onTyping: () => void;
  detectedLanguageCode?: string;
  detectedLanguageName?: string;
  onTranslateOutbound: () => void;
  isTranslatingOutbound: boolean;
}

export const MessageInputArea = memo(function MessageInputArea({
  value,
  onChange,
  onSend,
  onFileSelect,
  pendingFiles,
  onRemoveFile,
  isSending,
  onTyping,
  detectedLanguageCode,
  detectedLanguageName,
  onTranslateOutbound,
  isTranslatingOutbound,
}: MessageInputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize message textarea
  useAutoResizeTextarea(messageTextareaRef, value, { minRows: 1, maxRows: 5 });

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    onTyping();
  }, [onChange, onTyping]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = messageTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.slice(0, start) + emoji + value.slice(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      onChange(value + emoji);
    }
  }, [value, onChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSend();
  }, [onSend]);

  const showTranslateButton = detectedLanguageCode && detectedLanguageCode !== 'en';
  const langName = detectedLanguageName || detectedLanguageCode;

  return (
    <div className="px-6 py-4 border-t bg-background shrink-0">
      {/* Pending Files Preview */}
      {pendingFiles && pendingFiles.files.length > 0 && (
        <div className="max-w-4xl mx-auto mb-3">
          <div className="flex flex-wrap gap-2">
            {pendingFiles.files.map((file, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
              >
                {file.type.startsWith('image/') ? (
                  <img 
                    src={pendingFiles.urls[index]} 
                    alt={file.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <FileTypeIcon fileName={file.name} width={20} height={20} />
                )}
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="p-0.5 hover:bg-accent rounded"
                >
                  <XClose size={14} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-3 max-w-4xl mx-auto"
      >
        <QuickEmojiButton
          onEmojiSelect={handleEmojiSelect}
          disabled={isSending}
        />
        
        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx"
          onChange={onFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="h-10 w-10"
          aria-label="Attach files"
        >
          <Attachment01 size={18} aria-hidden="true" />
        </Button>
        
        {/* Translate Outbound Button - show for non-English conversations */}
        {showTranslateButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onTranslateOutbound}
                disabled={isTranslatingOutbound || !value.trim()}
                className="h-10 w-10"
                aria-label={`Translate to ${langName}`}
              >
                {isTranslatingOutbound ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Translate01 size={18} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="flex items-center gap-1.5">
                {getLanguageFlag(detectedLanguageCode!)} Translate to {langName}
              </span>
            </TooltipContent>
          </Tooltip>
        )}
        
        <div className="relative flex-1">
          <Textarea
            ref={messageTextareaRef}
            placeholder="Type a message..."
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            rows={1}
            className="min-h-[40px] max-h-[120px] py-2.5 pr-12 resize-none"
          />
          <Button 
            type="submit" 
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            disabled={isSending || (!value.trim() && !pendingFiles)}
            aria-label="Send message"
          >
            <Send01 size={16} aria-hidden="true" />
          </Button>
        </div>
      </form>
    </div>
  );
});

export default MessageInputArea;
