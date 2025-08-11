"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BellRing } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const AdminNotificationBell: React.FC = () => {
  const { notifications } = useAdminNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10">
          <BellRing className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-1 text-xs"
            >
              {notifications.length}
            </Badge>
          )}
          <span className="sr-only">Toggle admin notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          New Feedback Submissions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-4">No new feedback.</p>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  to="/admin/feedback"
                  state={{ feedbackId: notification.id }}
                  className="flex flex-col items-start cursor-pointer"
                >
                  <p className="font-semibold">
                    {notification.profiles?.first_name || 'Student'} on {notification.subjects.name} {/* Renamed from classes.name */}
                  </p>
                  <p className="text-sm text-muted-foreground truncate w-full">
                    {notification.comment || "No comment provided."}
                  </p>
                  <p className="text-xs text-muted-foreground/70 self-end">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminNotificationBell;