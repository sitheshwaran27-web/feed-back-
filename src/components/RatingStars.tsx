"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  starClassName?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, maxStars = 5, starClassName }) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300',
            starClassName
          )}
        />
      ))}
    </div>
  );
};

export default RatingStars;