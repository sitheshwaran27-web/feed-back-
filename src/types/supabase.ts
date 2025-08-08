export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string;
  email?: string; // Added for convenience when joining with auth.users
}

export interface Class {
  id: string;
  name: string;
  period: number; // Changed from period_number to period
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  day_of_week: number;
  class_id: string;
  created_at: string;
  classes: Class; // Joined class data
}

export interface Feedback {
  id: string;
  student_id: string;
  class_id: string;
  rating: number;
  comment: string | null;
  admin_response: string | null;
  created_at: string;
  classes: { // Simplified for feedback join, as only name and period are used
    name: string;
    period: number; // Changed from period_number to period
  };
  profiles?: { // Simplified for feedback join, as only first/last name are used
    first_name: string | null;
    last_name: string | null;
  };
}

// Specific types for hooks/components that might need slightly different structures
export interface DailyClass extends Class {
  hasSubmittedFeedback?: boolean;
}

export interface FeedbackHistoryEntry extends Feedback {
  classes: {
    name: string;
    period: number; // Changed from period_number to period
  };
}

export interface ClassFeedbackStats {
  class_id: string;
  class_name: string;
  period: number; // Changed from period_number to period
  average_rating: number;
  feedback_count: number;
}