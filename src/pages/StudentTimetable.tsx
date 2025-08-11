"use client";

import React, { useMemo } from 'react';
import { useWeeklyTimetable } from '@/hooks/useWeeklyTimetable';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TimetableEntry } from '@/types/supabase';

const periods = Array.from({ length: 7 }, (_, i) => i + 1); // Periods 1-7

const StudentTimetable = () => {
  const { groupedTimetable, loading, daysOfWeek } = useWeeklyTimetable();
  const navigate = useNavigate();

  const timetableGrid = useMemo(() => {
    const grid: (TimetableEntry | null)[][] = Array(periods.length).fill(null).map(() => Array(daysOfWeek.length).fill(null));
    Object.values(groupedTimetable).flat().forEach(entry => {
      if (entry.classes) {
        const dayIndex = entry.day_of_week - 1;
        const periodIndex = entry.classes.period - 1;
        if (dayIndex >= 0 && dayIndex < daysOfWeek.length && periodIndex >= 0 && periodIndex < periods.length) {
          grid[periodIndex][dayIndex] = entry;
        }
      }
    });
    return grid;
  }, [groupedTimetable, daysOfWeek]);

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1">
      {/* Header: Empty corner + Days of week skeletons */}
      <div />
      {daysOfWeek.map(day => (
        <div key={day.value} className="text-center font-semibold p-2">
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
      ))}

      {/* Timetable Body: Periods skeletons + Grid Cell skeletons */}
      {periods.map((period) => (
        <React.Fragment key={period}>
          <div className="text-center font-semibold p-2 self-center">
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
          {daysOfWeek.map((day) => (
            <div key={day.value} className="border rounded-md p-2 min-h-[80px] flex flex-col justify-center items-center bg-muted/20">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 h-full">
      <div className="w-full max-w-7xl mb-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Your Weekly Timetable</h1>
            <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </div>
      </div>

      <Card className="w-full max-w-7xl mx-auto">
        <CardContent className="p-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : (
            <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1">
              {/* Header: Empty corner + Days of week */}
              <div />
              {daysOfWeek.map(day => (
                <div key={day.value} className="text-center font-semibold p-2">{day.label}</div>
              ))}

              {/* Timetable Body: Periods + Grid Cells */}
              {periods.map((period, periodIndex) => (
                <React.Fragment key={period}>
                  <div className="text-center font-semibold p-2 self-center">P{period}</div>
                  {daysOfWeek.map((day, dayIndex) => {
                    const entry = timetableGrid[periodIndex][dayIndex];
                    return (
                      <div key={day.value} className="border rounded-md p-2 min-h-[80px] flex flex-col justify-center items-center bg-muted/20">
                        {entry ? (
                          <div className="w-full text-center">
                            <p className="font-semibold text-sm">{entry.classes.name} (P{entry.classes.period})</p>
                            <p className="text-xs text-muted-foreground">{entry.classes.start_time} - {entry.classes.end_time}</p>
                          </div>
                        ) : (
                          <div /> // Empty cell
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTimetable;