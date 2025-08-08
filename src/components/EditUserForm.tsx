"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Profile } from '@/types/supabase';

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").optional().or(z.literal("")),
  is_admin: z.boolean(),
});

type EditUserFormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
  initialData: Omit<Profile, 'id' | 'avatar_url' | 'updated_at' | 'email'>;
  onSubmit: (data: EditUserFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  email: string;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting, email }) => {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col items-center space-y-2 mb-4">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{email}</p>
        </div>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="User's first name" {...field} />
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
                <Input placeholder="User's last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_admin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Admin Status</FormLabel>
                <FormDescription>
                  Toggle to grant or revoke administrator privileges for this user.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Update User"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditUserForm;