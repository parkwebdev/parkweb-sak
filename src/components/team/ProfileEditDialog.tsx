import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/team';
import { Upload01 as Upload } from '@untitledui/icons';

interface ProfileEditDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  member,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (member) {
      setDisplayName(member.display_name || '');
      setAvatarUrl(member.avatar_url || '');
    }
  }, [member]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !member) return;

    // Reset the input to allow re-uploading the same file
    event.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${member.user_id}-${Date.now()}.${fileExt}`;

      console.log('Starting avatar upload:', { 
        fileName, 
        fileSize: file.size, 
        fileType: file.type,
        memberId: member.user_id 
      });

      // Upload the new file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: false  // Don't overwrite, create new file
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = urlData.publicUrl;
      console.log('New avatar URL:', newAvatarUrl);
      
      setAvatarUrl(newAvatarUrl);

      toast({
        title: "Avatar uploaded",
        description: "Avatar has been uploaded successfully. Click 'Save Changes' to apply.",
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;

    setLoading(true);
    try {
      console.log('Updating profile for member:', {
        user_id: member.user_id,
        old_display_name: member.display_name,
        new_display_name: displayName.trim() || null,
        old_avatar_url: member.avatar_url,
        new_avatar_url: avatarUrl || null,
      });

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update fields that have actually changed
      if (displayName.trim() !== (member.display_name || '')) {
        updateData.display_name = displayName.trim() || null;
      }

      if (avatarUrl !== (member.avatar_url || '')) {
        updateData.avatar_url = avatarUrl || null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', member.user_id)
        .select();

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);

      toast({
        title: "Profile updated",
        description: `${displayName || member.email}'s profile has been updated successfully.`,
      });

      // Force refresh the parent component
      onUpdate();
      onClose();
      
      // Small delay to ensure the update propagates
      setTimeout(() => {
        onUpdate();
      }, 100);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update {member.display_name || member.email}'s profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-lg">
                {displayName 
                  ? displayName.split(' ').map(n => n[0]).join('').toUpperCase()
                  : member.email?.substring(0, 2).toUpperCase() || 'U'
                }
              </AvatarFallback>
            </Avatar>
            
            <div className="flex items-center gap-2">
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              <Label htmlFor="avatar-upload" className="cursor-pointer">
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
              </Label>
              {avatarUrl && avatarUrl !== member?.avatar_url && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✓ New avatar ready
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </div>

          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={member.email || ''} disabled className="bg-muted" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};