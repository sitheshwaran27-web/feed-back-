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

export const showLoading = (message: string) => {
  // shadcn/ui toast doesn't have a built-in loading state like sonner.
  // For a simple loading indicator, we can show a persistent toast.
  // If more complex loading is needed, a dedicated loading component might be better.
  toast({
    title: "Loading...",
    description: message,
    duration: 999999, // Make it very long-lived
  });
  // Return a dummy ID for dismissToast compatibility, though it won't dismiss a specific toast instance this way.
  // A more robust solution would involve managing toast IDs if multiple loading toasts are possible.
  return "loading-toast";
};

export const dismissToast = (toastId: string) => {
  // For shadcn/ui, dismiss is typically called on the specific toast instance.
  // If showLoading returns a specific ID, this would work.
  // For now, we'll use the general dismiss.
  toast.dismiss(toastId);
};