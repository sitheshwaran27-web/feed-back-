"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ClassForm from './ClassForm';
import { Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useClasses } from '@/hooks/useClasses';
import { Class } from '@/types/supabase'; // Import Class

const ClassManager: React.FC = () => {
  const { classes, loading, isSubmitting, addClass, updateClass, deleteClass } = useClasses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const handleAddClass = async (values: Omit<Class, 'id' | 'created_at'>) => {
    const newClass = await addClass(values);
    if (newClass) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateClass = async (values: Omit<Class, 'id' | 'created_at'>) => {
    if (!editingClass) return;
    const updatedClass = await updateClass(editingClass.id, values);
    if (updatedClass) {
      setIsFormOpen(false);
      setEditingClass(null);
    }
  };

  const handleDeleteClass = async (id: string) => {
    await deleteClass(id);
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
            {isFormOpen && (
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
              {classes.map((cls: Class) => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.period_number}</TableCell>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.start_time}</TableCell>
                  <TableCell>{cls.end_time}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openEditForm(cls)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <ConfirmAlertDialog
                      title="Are you absolutely sure?"
                      description="This action cannot be undone. This will permanently delete the class and any associated feedback."
                      onConfirm={() => handleDeleteClass(cls.id)}
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
      </CardContent>
    </Card>
  );
};

export default ClassManager;