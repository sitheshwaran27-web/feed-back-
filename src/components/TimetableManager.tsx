"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Loader2 } from 'lucide-react'; // Import Loader2 icon
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface Class {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: number;
  class_id: string;
  classes: Class; // Joined class data
}

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const formSchema = z.object({
  day_of_week: z.coerce.number().min(1, "Day of week is required").max(7, "Invalid day of week"),
  class_id: z.string().min(1, "Class is required"),
});

type TimetableFormValues = z.infer<typeof formSchema>;

interface TimetableFormProps {
  availableClasses: Class[];
  onSubmit: (data: TimetableFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TimetableForm: React.FC<TimetableFormProps> = ({ availableClasses, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day_of_week: 1,
      class_id: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="day_of_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day of Week</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name} (P{cls.period_number})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Adding..." : "Add to Timetable"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const TimetableManager: React.FC = () => {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('period_number', { ascending: true });

    if (classesError) {
      console.error("Error fetching classes:", classesError);
      showError("Failed to load classes for timetable.");
    } else {
      setAvailableClasses(classesData || []);
    }

    const { data: timetableData, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        id,
        day_of_week,
        class_id,
        classes (id, name, period_number, start_time, end_time)
      `)
      .order('day_of_week', { ascending: true })
      .order('classes.period_number', { ascending: true });

    if (timetableError) {
      console.error("Error fetching timetable entries:", timetableError);
      showError("Failed to load timetable entries.");
    } else {
      setTimetableEntries(timetableData || []);
    }
    setLoading(false);
  };

  const handleAddTimetableEntry = async (values: TimetableFormValues) => {
    setIsSubmitting(true);

    // Check for existing entry
    const { data: existingEntry, error: checkError } = await supabase
      .from('timetables')
      .select('id')
      .eq('day_of_week', values.day_of_week)
      .eq('class_id', values.class_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error checking for existing timetable entry:", checkError);
      showError("Failed to check for existing timetable entry.");
      setIsSubmitting(false);
      return;
    }

    if (existingEntry) {
      showError("This class is already scheduled for this day.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from('timetables')
      .insert(values)
      .select(`
        id,
        day_of_week,
        class_id,
        classes (id, name, period_number, start_time, end_time)
      `)
      .single();

    if (error) {
      console.error("Error adding timetable entry:", error);
      showError("Failed to add timetable entry.");
    } else {
      showSuccess("Timetable entry added successfully!");
      setTimetableEntries([...timetableEntries, data]);
      setIsFormOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting timetable entry:", error);
      showError("Failed to delete timetable entry.");
    } else {
      showSuccess("Timetable entry deleted successfully!");
      setTimetableEntries(timetableEntries.filter(entry => entry.id !== id));
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const getDayLabel = (dayValue: number) => {
    return daysOfWeek.find(day => day.value === dayValue)?.label || 'Unknown';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Weekly Timetable</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>Add Timetable Entry</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Timetable Entry</DialogTitle>
            </DialogHeader>
            {isFormOpen && (
              <TimetableForm
                availableClasses={availableClasses}
                onSubmit={handleAddTimetableEntry}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day of Week</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : timetableEntries.length === 0 ? (
          <p className="text-center">No timetable entries added yet. Click "Add Timetable Entry" to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day of Week</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timetableEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{getDayLabel(entry.day_of_week)}</TableCell>
                  <TableCell>{entry.classes?.name}</TableCell>
                  <TableCell>{entry.classes?.period_number}</TableCell>
                  <TableCell>{entry.classes?.start_time} - {entry.classes?.end_time}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove this class from the timetable for this day.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTimetableEntry(entry.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableManager;