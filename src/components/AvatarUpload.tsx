"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploadSuccess: (url: string) => void;
  onRemoveSuccess: () => void;
  disabled?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatarUrl,
  onUploadSuccess,
  onRemoveSuccess,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // If there's an existing avatar, remove it first
      if (currentAvatarUrl) {
        const oldFileName = currentAvatarUrl.split('/').pop();
        if (oldFileName) {
          const { error: deleteError } = await supabase.storage.from('avatars').remove([oldFileName]);
          if (deleteError) {
            console.error("Error deleting old avatar:", deleteError);
            // Don't show error to user, just log it. Continue with new upload.
          }
        }
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // We handle upsert logic manually by deleting old file
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      onUploadSuccess(publicUrlData.publicUrl);
      showSuccess("Avatar uploaded successfully!");
    } catch (error: unknown) {
      console.error("Error uploading avatar:", error);
      showError(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) return;

    setUploading(true); // Use uploading state for removal too
    const fileName = currentAvatarUrl.split('/').pop();
    if (!fileName) {
      showError("Could not determine file name for removal.");
      setUploading(false);
      return;
    }

    try {
      const { error } = await supabase.storage.from('avatars').remove([fileName]);
      if (error) {
        throw error;
      }
      onRemoveSuccess();
      showSuccess("Avatar removed successfully!");
    } catch (error: unknown) {
      console.error("Error removing avatar:", error);
      showError(`Failed to remove avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Input
        type="file"
        id="avatar-upload"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Change Avatar
          </>
        )}
      </Button>
      {currentAvatarUrl && (
        <Button
          type="button"
          variant="destructive"
          onClick={handleRemoveAvatar}
          disabled={disabled || uploading}
          className="w-full"
        >
          <XCircle className="mr-2 h-4 w-4" /> Remove Avatar
        </Button>
      )}
    </div>
  );
};

export default AvatarUpload;