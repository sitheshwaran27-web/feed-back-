"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const NotificationBell: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-1 text-xs"
            >
              {notifications.length}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-1">
              <CheckCheck className="mr-1 h-4 w-4" /> Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-4">You're all caught up!</p>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  to="/student/feedback-history"
                  state={{ feedbackId: notification.id }}
                  className="flex flex-col items-start cursor-pointer"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <p className="font-semibold">Response for {notification.subjects.name}</p> {/* Renamed from classes.name */}
                  <p className="text-sm text-muted-foreground truncate w-full">
                    {notification.admin_response}
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

export default NotificationBell;