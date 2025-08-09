"use client";

import React, { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserManager } from '@/hooks/useUserManager';
import { Profile } from '@/types/supabase'; // Import Profile
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react'; // Import Trash2 icon
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EditUserForm from './EditUserForm'; // Import the new form
import ConfirmAlertDialog from './ConfirmAlertDialog'; // Import ConfirmAlertDialog
import { Input } from '@/components/ui/input'; // Import Input for search

const UserManager: React.FC = () => {
  const { users, loading, updatingUserId, toggleAdminStatus, updateUser, deleteUser } = useUserManager();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      (user.first_name?.toLowerCase().includes(lowercasedSearchTerm)) ||
      (user.last_name?.toLowerCase().includes(lowercasedSearchTerm)) ||
      (user.email?.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [users, searchTerm]);

  const handleUpdateUser = async (values: { first_name?: string; last_name?: string; is_admin?: boolean }) => {
    if (!editingUser) return;
    const updated = await updateUser(editingUser.id, values);
    if (updated) {
      setIsEditFormOpen(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
  };

  const openEditForm = (user: Profile) => {
    setEditingUser(user);
    setIsEditFormOpen(true);
  };

  const closeEditForm = () => {
    setIsEditFormOpen(false);
    setEditingUser(null);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center py-8">
            {searchTerm ? 'No users match your search.' : 'No users found.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: Profile) => (
                <TableRow key={user.id}>
                  <TableCell>{user.first_name || 'N/A'} {user.last_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Switch
                        id={`admin-switch-${user.id}`}
                        checked={user.is_admin}
                        onCheckedChange={() => toggleAdminStatus(user.id, user.is_admin)}
                        disabled={updatingUserId === user.id}
                      />
                      <Label htmlFor={`admin-switch-${user.id}`}>
                        {user.is_admin ? 'Yes' : 'No'}
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openEditForm(user)} disabled={updatingUserId === user.id} className="mr-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <ConfirmAlertDialog
                      title="Are you absolutely sure?"
                      description="This action cannot be undone. This will permanently delete the user account and all associated data (profile, feedback, etc.)."
                      onConfirm={() => handleDeleteUser(user.id)}
                    >
                      <Button variant="destructive" size="sm" disabled={updatingUserId === user.id}>
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
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <EditUserForm
              initialData={{
                first_name: editingUser.first_name || "",
                last_name: editingUser.last_name || "",
                is_admin: editingUser.is_admin,
              }}
              onSubmit={handleUpdateUser}
              onCancel={closeEditForm}
              isSubmitting={updatingUserId === editingUser.id}
              email={editingUser.email || "N/A"}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManager;