"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useTimetable } from '@/hooks/useTimetable';
import { TimetableEntry, Class } from '@/types/supabase';
import TimetableForm from './TimetableForm';

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];
const periods = Array.from({ length: 7 }, (_, i) => i + 1); // Periods 1-7

const TimetableManager: React.FC = () => {
  const { timetableEntries, availableClasses, loading, isSubmitting, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry } = useTimetable();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formInitialData, setFormInitialData] = useState<{ day_of_week: number; class_id: string } | undefined>(undefined);
  const [formAvailableClasses, setFormAvailableClasses] = useState<Class[]>([]);

  const handleAddTimetableEntry = async (values: { day_of_week: number; class_id: string }) => {
    const newEntry = await addTimetableEntry(values);
    if (newEntry) {
      closeForm();
    }
  };

  const handleUpdateTimetableEntry = async (values: { day_of_week: number; class_id: string }) => {
    if (!editingEntry) return;
    const updated = await updateTimetableEntry(editingEntry.id, values);
    if (updated) {
      closeForm();
    }
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    await deleteTimetableEntry(id);
  };

  const openFormForAdd = (day: number, period: number) => {
    setEditingEntry(null);
    setFormInitialData({ day_of_week: day, class_id: "" });
    setFormAvailableClasses(availableClasses.filter(c => c.period === period));
    setIsFormOpen(true);
  };

  const openFormForEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormInitialData({ day_of_week: entry.day_of_week, class_id: entry.class_id });
    // For editing, show ALL available classes, not just those of the same period
    setFormAvailableClasses(availableClasses);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    setFormInitialData(undefined);
    setFormAvailableClasses([]);
  };

  const timetableGrid = useMemo(() => {
    const grid: (TimetableEntry | null)[][] = Array(periods.length).fill(null).map(() => Array(daysOfWeek.length).fill(null));
    timetableEntries.forEach(entry => {
      if (entry.classes) {
        const dayIndex = entry.day_of_week - 1;
        const periodIndex = entry.classes.period - 1;
        if (dayIndex >= 0 && dayIndex < daysOfWeek.length && periodIndex >= 0 && periodIndex < periods.length) {
          grid[periodIndex][dayIndex] = entry;
        }
      }
    });
    return grid;
  }, [timetableEntries]);

  return (
    <Card className="w-full max-w-7xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Manage Weekly Timetable</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1">
            {/* Header: Empty corner + Days of week */}
            <div />
            {daysOfWeek.map(day => (
              <div key={day.value} className="text-center font-semibold p-2">{day.label}</div>
            ))}

            {/* Timetable Body: Periods + Grid Cells */}
            {periods.map((period, periodIndex) => (
              <React.Fragment key={period}>
                <div className="text-center font-semibold p-2 self-center">P{period}</div>
                {daysOfWeek.map((day, dayIndex) => {
                  const entry = timetableGrid[periodIndex][dayIndex];
                  return (
                    <div key={day.value} className="border rounded-md p-2 min-h-[80px] flex flex-col justify-center items-center bg-muted/20">
                      {entry ? (
                        <div className="w-full text-center">
                          <p className="font-semibold text-sm">{entry.classes.name} (P{entry.classes.period})</p>
                          <p className="text-xs text-muted-foreground">{entry.classes.start_time} - {entry.classes.end_time}</p>
                          <div className="mt-2 flex justify-center space-x-1">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => openFormForEdit(entry)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <ConfirmAlertDialog
                              title="Are you sure?"
                              description="This will permanently remove this class from the timetable for this day."
                              onConfirm={() => handleDeleteTimetableEntry(entry.id)}
                            >
                              <Button variant="destructive" size="icon" className="h-6 w-6">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </ConfirmAlertDialog>
                          </div>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-full w-full" onClick={() => openFormForAdd(day.value, period)}>
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Timetable Entry" : "Add New Timetable Entry"}</DialogTitle>
          </DialogHeader>
          <TimetableForm
            initialData={formInitialData}
            availableClasses={formAvailableClasses}
            onSubmit={editingEntry ? handleUpdateTimetableEntry : handleAddTimetableEntry}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TimetableManager;