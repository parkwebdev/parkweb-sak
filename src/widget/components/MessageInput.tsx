import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send01, Microphone01, Attachment01, X, FileCheck02 } from '@untitledui/icons';
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
  return (
    <>
      {pendingFiles.length > 0 && (
        <div className="p-2 border-t flex gap-2 overflow-x-auto">
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
      
      <div className="p-3 border-t">
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
          <div className="flex items-center gap-2">
            <Input
              value={messageInput}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
              placeholder={placeholder}
              disabled={disabled}
              className={`flex-1 h-9 text-sm placeholder:text-xs ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {enableFileAttachments && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={onAttachFiles}
                disabled={disabled}
                className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Attachment01 className="h-4 w-4" />
              </Button>
            )}
            {enableVoiceMessages && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={onStartRecording}
                disabled={disabled}
                className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Microphone01 className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="icon" 
              className={`h-9 w-9 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={onSend} 
              disabled={disabled}
              style={{ backgroundColor: primaryColor }}
            >
              <Send01 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
