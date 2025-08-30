export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string;
  email?: string; // Added back as optional for RPC function return
  batch_id: string | null;
  semester_number: number | null;
  batches?: { // Joined batch data
    name: string;
  };
}

export interface Batch {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id:string;
  name: string;
  period: number | null;
  batch_id: string | null;
  semester_number: number | null;
  created_at: string;
  batches?: { // Joined batch data
    name: string;
  };
}

export interface TimetableEntry {
  id: string;
  day_of_week: number;
  subject_id: string; // Renamed from class_id
  batch_id: string | null;
  semester_number: number | null;
  created_at: string;
  start_time: string;
  end_time: string;
  subjects: { // Joined subject data (formerly classes)
    id: string;
    name: string;
    period: number | null;
  };
  batches?: { // Joined batch data
    name: string;
  };
}

export interface Feedback {
  id: string;
  student_id: string;
  subject_id: string; // Renamed from class_id
  batch_id: string | null;
  semester_number: number | null;
  rating: number;
  comment: string | null;
  admin_response: string | null;
  created_at: string;
  is_response_seen_by_student?: boolean; // Added for notifications
  subjects: { // Simplified for feedback join (formerly classes)
    name: string;
  };
  profiles?: { // Simplified for feedback join
    first_name: string | null;
    last_name: string | null;
    batch_id: string | null;
    semester_number: number | null;
  };
  batches?: { // Joined batch data
    name: string;
  };
}

// Specific types for hooks/components that might need slightly different structures
export interface DailySubject { // Renamed from DailyClass
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  hasSubmittedFeedback?: boolean;
  batch_id: string | null;
  semester_number: number | null;
}

export interface FeedbackHistoryEntry extends Feedback {
  subjects: { // Renamed from classes
    name: string;
  };
}

export interface SubjectFeedbackStats { // Renamed from ClassFeedbackStats
  subject_id: string; // Renamed from class_id
  subject_name: string; // Renamed from class_name
  average_rating: number | null;
  feedback_count: bigint;
  rating_counts: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface SubjectPerformanceSummary { // Renamed from ClassPerformanceSummary
  subject_id: string; // Renamed from class_id
  subject_name: string; // Renamed from class_name
  average_rating: number | null;
  feedback_count: number;
}

export interface FeedbackTrendPoint {
  date: string;
  submission_count: number;
  average_rating: number | null;
}
