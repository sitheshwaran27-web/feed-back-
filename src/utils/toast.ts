"use client";

import { toast } from "@/hooks/use-toast"; // Import shadcn/ui's toast

export const showSuccess = (message: string) => {
  toast({
    title: "Success!",
    description: message,
    variant: "default", // Default variant for success
  });
};

export const showError = (message: string) => {
  toast({
    title: "Error!",
    description: message,
    variant: "destructive", // Destructive variant for errors
  });
};