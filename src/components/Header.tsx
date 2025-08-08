"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils'; // Import cn utility for conditional class names
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { useProfile } from '@/hooks/useProfile'; // Import useProfile hook

const Header: React.FC = () => {
  const { session, isLoading, isAdmin, isProfileIncompleteRedirect } = useSession();
  const { profile, loading: profileLoading } = useProfile(); // Fetch profile for avatar

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // SessionContextProvider will handle the redirect to /login
  };

  if (isLoading || !session || profileLoading) {
    return null; // Don't render header if loading or not authenticated or profile is loading
  }

  // Disable navigation if profile is incomplete and user was redirected
  const disableNavigation = isProfileIncompleteRedirect;
  const disabledTooltipContent = "Please complete your profile first to access other pages.";

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md w-full">
      <div className="container mx-auto flex justify-between items-center">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"}
              className={cn(
                "text-2xl font-bold",
                disableNavigation && "opacity-60 cursor-not-allowed"
              )}
              onClick={(e) => disableNavigation && e.preventDefault()} // Prevent navigation if disabled
            >
              Feedback Portal
            </Link>
          </TooltipTrigger>
          {disableNavigation && <TooltipContent>{disabledTooltipContent}</TooltipContent>}
        </Tooltip>

        <nav className="flex items-center space-x-4">
          {profile?.avatar_url ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatar_url} alt="User Avatar" />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" className={cn(
                "text-primary-foreground hover:bg-primary-foreground/10",
                disableNavigation && "opacity-60 cursor-not-allowed"
              )} disabled={disableNavigation}>
                <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> {isAdmin ? "Admin Dashboard" : "Student Dashboard"}
                </Link>
              </Button>
            </TooltipTrigger>
            {disableNavigation && <TooltipContent>{disabledTooltipContent}</TooltipContent>}
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" className={cn(
                "text-primary-foreground hover:bg-primary-foreground/10",
                disableNavigation && "opacity-60 cursor-not-allowed"
              )} disabled={disableNavigation}>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </Button>
            </TooltipTrigger>
            {disableNavigation && <TooltipContent>{disabledTooltipContent}</TooltipContent>}
          </Tooltip>

          <ThemeToggle />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className={cn(
                "text-primary-foreground hover:bg-primary-foreground/10",
                disableNavigation && "opacity-60 cursor-not-allowed"
              )} disabled={disableNavigation}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out of your account. You can always sign back in later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>
    </header>
  );
};

export default Header;