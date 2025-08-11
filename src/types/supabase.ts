export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string;
  // email?: string; // Removed: email is accessed via auth.users or session.user.email
}

export interface Class {
  id:string;
  name: string;
  period: number;
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
  is_response_seen_by_student?: boolean; // Added for notifications
  classes: { // Simplified for feedback join, as only name and period are used
    name: string;
    period: number;
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
    period: number;
  };
}

export interface ClassFeedbackStats {
  class_id: string;
  class_name: string;
  period: number;
  average_rating: number;
  feedback_count: number;
  rating_counts: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface ClassPerformanceSummary {
  class_id: string;
  class_name: string;
  period: number;
  average_rating: number;
  feedback_count: number;
}

export interface FeedbackTrendPoint {
  date: string;
  submission_count: number;
  average_rating: number | null;
}