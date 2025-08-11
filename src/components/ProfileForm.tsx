"use client";

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { Profile } from '@/types/supabase';
import AvatarUpload from './AvatarUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches';

// Define a base schema for fields common to all users
const baseSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  avatar_url: z.string().url("Invalid URL format").nullable().optional(),
});

// Define the shape of the form values
type ProfileFormValues = z.infer<typeof baseSchema> & {
  batch_id?: string;
  semester_number?: number;
};

interface ProfileFormProps {
  initialData?: Omit<Profile, 'id' | 'is_admin' | 'updated_at' | 'email' | 'batches'>;
  onSubmit: (data: ProfileFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  email: string;
  userId: string;
  isAdmin: boolean; // Add isAdmin prop
  disableCancel?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting, email, userId, isAdmin, disableCancel = false }) => {
  const { batches, loading: batchesLoading } = useBatches();

  // Create a dynamic schema based on the user's role
  const formSchema = useMemo(() => {
    if (isAdmin) {
      return baseSchema.extend({
        batch_id: z.string().optional(),
        semester_number: z.coerce.number().optional(),
      });
    }
    return baseSchema.extend({
      batch_id: z.string().min(1, "Batch is required"),
      semester_number: z.coerce.number().min(1, "Semester is required").max(8, "Semester must be between 1 and 8"),
    });
  }, [isAdmin]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      first_name: "",
      last_name: "",
      avatar_url: "",
      batch_id: "",
      semester_number: undefined,
    },
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  const handleAvatarUploadSuccess = (url: string) => {
    form.setValue("avatar_url", url, { shouldDirty: true, shouldValidate: true });
  };

  const handleAvatarRemoveSuccess = () => {
    form.setValue("avatar_url", "", { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col items-center space-y-4 mb-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={form.watch("avatar_url") || undefined} alt="User Avatar" />
            <AvatarFallback>
              <User className="h-12 w-12 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{email}</p>
          <AvatarUpload
            userId={userId}
            currentAvatarUrl={form.watch("avatar_url")}
            onUploadSuccess={handleAvatarUploadSuccess}
            onRemoveSuccess={handleAvatarRemoveSuccess}
            disabled={isSubmitting}
          />
        </div>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Your first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isAdmin && (
          <>
            <FormField
              control={form.control}
              name="batch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={batchesLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your batch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="semester_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting || disableCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProfileForm;