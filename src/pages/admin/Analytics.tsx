"use client";

import React from 'react';
import FeedbackBreakdown from '@/components/admin/FeedbackBreakdown';
import FeedbackTrends from '@/components/admin/FeedbackTrends';
import { Separator } from '@/components/ui/separator';

const AdminAnalyticsPage = () => {
  return (
    <div className="space-y-8">
      <FeedbackTrends />
      <Separator />
      <FeedbackBreakdown />
    </div>
  );
};

export default AdminAnalyticsPage;