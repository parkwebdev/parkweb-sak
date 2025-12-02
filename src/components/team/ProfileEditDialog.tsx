import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/team';
import { SimpleAvatarUpload } from './SimpleAvatarUpload';

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

  useEffect(() => {
    if (member) {
      console.log('🔄 ProfileEditDialog: Setting initial values for member:', member.user_id);
      setDisplayName(member.display_name || '');
      setAvatarUrl(member.avatar_url || '');
    }
  }, [member]);

  const handleSave = async () => {
    if (!member) return;

    console.log('💾 Starting profile save...', {
      memberId: member.user_id,
      oldDisplayName: member.display_name,
      newDisplayName: displayName.trim() || null,
      oldAvatarUrl: member.avatar_url,
      newAvatarUrl: avatarUrl || null,
    });

    setLoading(true);
    
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update fields that have actually changed
      if (displayName.trim() !== (member.display_name || '')) {
        updateData.display_name = displayName.trim() || null;
        console.log('🏷️ Display name will be updated:', updateData.display_name);
      }

      if (avatarUrl !== (member.avatar_url || '')) {
        updateData.avatar_url = avatarUrl || null;
        console.log('🖼️ Avatar URL will be updated:', updateData.avatar_url);
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', member.user_id)
        .select();

      if (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully. Rows affected:', data?.length || 0);
      console.log('📝 Updated data:', data);

      if (!data || data.length === 0) {
        throw new Error('No rows were updated. This might be a permissions issue.');
      }

      toast.success("Profile updated", {
        description: `${displayName || member.email}'s profile has been updated successfully.`,
      });

      // Trigger refresh and close
      console.log('🔄 Calling onUpdate to refresh team list...');
      onUpdate();
      onClose();

    } catch (error: any) {
      console.error('💥 Error updating profile:', error);
      toast.error("Update failed", {
        description: error.message || "Failed to update profile. Please try again.",
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
          <SimpleAvatarUpload
            currentAvatarUrl={avatarUrl}
            displayName={displayName}
            email={member.email || undefined}
            memberId={member.user_id}
            onAvatarChange={(newUrl) => {
              console.log('🖼️ Avatar changed:', newUrl);
              setAvatarUrl(newUrl);
            }}
          />

          <div className="grid gap-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => {
                console.log('🏷️ Display name changed:', e.target.value);
                setDisplayName(e.target.value);
              }}
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