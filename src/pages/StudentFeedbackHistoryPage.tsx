"use client";

import React from 'react';
import StudentFeedbackHistory from '@/components/StudentFeedbackHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentFeedbackHistoryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center p-4 h-full">
      <div className="w-full max-w-4xl mb-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Your Feedback History</h1>
            <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </div>
      </div>
      <StudentFeedbackHistory />
    </div>
  );
};

export default StudentFeedbackHistoryPage;