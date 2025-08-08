"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Loader2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useTimetable } from '@/hooks/useTimetable';
import { Class, TimetableEntry } from '@/types/supabase'; // Import Class and TimetableEntry

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
  initialData?: TimetableFormValues; // Added for editing
  availableClasses: Class[];
  onSubmit: (data: TimetableFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TimetableForm: React.FC<TimetableFormProps> = ({ initialData, availableClasses, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      day_of_week: 1,
      class_id: "",
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
          name="day_of_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day of Week</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name} (P{cls.period})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {initialData ? "Update Entry" : "Add to Timetable"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const TimetableManager: React.FC = () => {
  const { timetableEntries, availableClasses, loading, isSubmitting, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry } = useTimetable();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  const handleAddTimetableEntry = async (values: TimetableFormValues) => {
    const newEntry = await addTimetableEntry(values);
    if (newEntry) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateTimetableEntry = async (values: TimetableFormValues) => {
    if (!editingEntry) return;
    const updated = await updateTimetableEntry(editingEntry.id, values);
    if (updated) {
      setIsFormOpen(false);
      setEditingEntry(null);
    }
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    await deleteTimetableEntry(id);
  };

  const openEditForm = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const getDayLabel = (dayValue: number) => {
    return daysOfWeek.find(day => day.value === dayValue)?.label || 'Unknown';
  };

  const groupedTimetable = useMemo(() => {
    const groups: { [key: number]: TimetableEntry[] } = {};
    daysOfWeek.forEach(day => (groups[day.value] = [])); // Initialize all days
    timetableEntries.forEach(entry => {
      if (groups[entry.day_of_week]) {
        groups[entry.day_of_week].push(entry);
      }
    });
    // Sort classes within each day by period and then start time
    Object.values(groups).forEach(dayEntries => {
      dayEntries.sort((a, b) => {
        if (a.classes.period !== b.classes.period) {
          return a.classes.period - b.classes.period;
        }
        return a.classes.start_time.localeCompare(b.classes.start_time);
      });
    });
    return groups;
  }, [timetableEntries]);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Weekly Timetable</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}>Add Timetable Entry</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Timetable Entry" : "Add New Timetable Entry"}</DialogTitle>
            </DialogHeader>
            {isFormOpen && (
              <TimetableForm
                initialData={editingEntry ? { day_of_week: editingEntry.day_of_week, class_id: editingEntry.class_id } : undefined}
                availableClasses={availableClasses}
                onSubmit={editingEntry ? handleUpdateTimetableEntry : handleAddTimetableEntry}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : Object.values(groupedTimetable).every(day => day.length === 0) ? (
          <p className="text-center">No timetable entries added yet. Click "Add Timetable Entry" to get started.</p>
        ) : (
          <div className="space-y-6">
            {daysOfWeek.map(day => (
              <div key={day.value} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">{day.label}</h3>
                {groupedTimetable[day.value].length === 0 ? (
                  <p className="text-sm text-gray-500">No classes scheduled for {day.label}.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedTimetable[day.value].map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.classes?.period}</TableCell>
                          <TableCell>{entry.classes?.name}</TableCell>
                          <TableCell>{entry.classes?.start_time} - {entry.classes?.end_time}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openEditForm(entry)} className="mr-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <ConfirmAlertDialog
                              title="Are you absolutely sure?"
                              description="This action cannot be undone. This will permanently remove this class from the timetable for this day."
                              onConfirm={() => handleDeleteTimetableEntry(entry.id)}
                            >
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ConfirmAlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableManager;