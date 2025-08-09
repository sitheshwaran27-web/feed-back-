"use client";

import React from 'react';
import { useWeeklyTimetable } from '@/hooks/useWeeklyTimetable';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentTimetable = () => {
  const { groupedTimetable, loading, daysOfWeek } = useWeeklyTimetable();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center p-4 h-full">
      <div className="w-full max-w-4xl mb-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Your Weekly Timetable</h1>
            <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </div>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-32 mb-3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {daysOfWeek.map(day => (
                <div key={day.value}>
                  <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">{day.label}</h3>
                  {groupedTimetable[day.value].length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-2">No classes scheduled.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Period</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedTimetable[day.value].map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.classes?.period}</TableCell>
                            <TableCell>{entry.classes?.name}</TableCell>
                            <TableCell>{entry.classes?.start_time} - {entry.classes?.end_time}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTimetable;