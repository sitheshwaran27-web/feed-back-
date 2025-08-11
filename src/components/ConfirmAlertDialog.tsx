"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmAlertDialogProps {
  children: React.ReactNode; // The trigger element
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const ConfirmAlertDialog = React.forwardRef<HTMLButtonElement, ConfirmAlertDialogProps>(
  ({ children, title, description, onConfirm, confirmText = "Continue", cancelText = "Cancel", variant = "destructive", size = "sm" }, ref) => {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild ref={ref}>
          {children}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelText}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

ConfirmAlertDialog.displayName = "ConfirmAlertDialog";

export default ConfirmAlertDialog;