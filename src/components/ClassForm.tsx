"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Class } from '@/types/supabase'; // Import Class

const formSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

type ClassFormValues = z.infer<typeof formSchema>;

interface ClassFormProps {
  initialData?: Omit<Class, 'id' | 'created_at'>; // Use Omit to exclude id and created_at
  onSubmit: (data: ClassFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ClassForm: React.FC<ClassFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
    },
  });

  const handleCancel = () => {
    form.reset(); // Reset form fields on cancel
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Mathematics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Class" : "Add Class"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClassForm;