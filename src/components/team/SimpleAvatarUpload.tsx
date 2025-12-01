import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload01 as Upload } from '@untitledui/icons';

interface SimpleAvatarUploadProps {
  currentAvatarUrl?: string;
  displayName?: string;
  email?: string;
  memberId: string;
  onAvatarChange: (newUrl: string) => void;
}

export const SimpleAvatarUpload: React.FC<SimpleAvatarUploadProps> = ({
  currentAvatarUrl,
  displayName,
  email,
  memberId,
  onAvatarChange,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ Starting simple avatar upload...');
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    // Reset the input
    event.target.value = '';

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create a simple filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar_${memberId}_${timestamp}.${fileExt}`;

      console.log('📤 Uploading to avatars bucket:', fileName);

      // Upload directly to the public avatars bucket
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ Upload successful:', uploadResult);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL generated:', urlData.publicUrl);

      // Update the parent component
      onAvatarChange(urlData.publicUrl);

      toast({
        title: "Avatar uploaded",
        description: "Avatar uploaded successfully!",
      });

    } catch (error: any) {
      console.error('💥 Avatar upload error:', error);
      
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={currentAvatarUrl} />
        <AvatarFallback className="text-lg">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex items-center gap-2">
        <input
          id={`avatar-upload-${memberId}`}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        <label htmlFor={`avatar-upload-${memberId}`} className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
};