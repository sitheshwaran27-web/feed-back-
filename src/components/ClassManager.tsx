"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } => '@/components/ui/dialog';
import ClassForm from './ClassForm';
import { Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface Class {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
}

const ClassManager: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('period_number', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching classes:", error);
      showError("Failed to load classes.");
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  };

  const handleAddClass = async (values: Omit<Class, 'id'>) => {
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('classes')
      .insert(values)
      .select()
      .single();

    if (error) {
      console.error("Error adding class:", error);
      showError("Failed to add class.");
    } else {
      showSuccess("Class added successfully!");
      setClasses([...classes, data]);
      setIsFormOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdateClass = async (values: Omit<Class, 'id'>) => {
    if (!editingClass) return;
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('classes')
      .update(values)
      .eq('id', editingClass.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating class:", error);
      showError("Failed to update class.");
    } else {
      showSuccess("Class updated successfully!");
      setClasses(classes.map(cls => cls.id === data.id ? data : cls));
      setIsFormOpen(false);
      setEditingClass(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteClass = async (id: string) => {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting class:", error);
      showError("Failed to delete class.");
    } else {
      showSuccess("Class deleted successfully!");
      setClasses(classes.filter(cls => cls.id !== id));
    }
  };

  const openEditForm = (cls: Class) => {
    setEditingClass(cls);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingClass(null);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Classes</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingClass(null); setIsFormOpen(true); }}>Add New Class</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            {isFormOpen && ( // Conditionally render ClassForm to ensure it resets on close/open
              <ClassForm
                initialData={editingClass || undefined}
                onSubmit={editingClass ? handleUpdateClass : handleAddClass}
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
                <TableHead>Period</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : classes.length === 0 ? (
          <p className="text-center">No classes added yet. Click "Add New Class" to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.period_number}</TableCell>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.start_time}</TableCell>
                  <TableCell>{cls.end_time}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditForm(cls)}>
                        <Edit className="h-4 w-4" />
                      </Button>
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
                              This action cannot be undone. This will permanently delete the class and any associated feedback.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClass(cls.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

export default ClassManager;