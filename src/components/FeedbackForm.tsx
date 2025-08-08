"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  rating: z.coerce.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(500, "Comment cannot exceed 500 characters").optional(),
});

type FeedbackFormValues = z.infer<typeof formSchema>;

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormValues) => void;
  isSubmitting: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, isSubmitting }) => {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                  className="flex space-x-2"
                >
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <FormItem key={starValue}>
                      <FormControl>
                        <RadioGroupItem
                          value={starValue.toString()}
                          id={`rating-${starValue}`}
                          className="sr-only" // Hide the radio button visually
                        />
                      </FormControl>
                      <label
                        htmlFor={`rating-${starValue}`}
                        className={cn(
                          "cursor-pointer text-gray-300 transition-colors",
                          (starValue <= (hoveredRating || field.value)) && "text-yellow-500"
                        )}
                        onMouseEnter={() => setHoveredRating(starValue)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </label>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional feedback?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </form>
    </Form>
  );
};

export default FeedbackForm;