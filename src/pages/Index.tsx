"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "Instant Feedback",
    description: "Provide feedback on your classes instantly and see responses from administrators.",
  },
  {
    icon: <Calendar className="h-8 w-8 text-primary" />,
    title: "Weekly Timetable",
    description: "Access your full weekly class schedule at a glance, anytime, anywhere.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: "Track Responses",
    description: "Get notified when an administrator responds to your feedback and track all your submissions.",
  },
];

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 py-12">
      <div className="text-center p-4 max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-800 dark:text-gray-100 tracking-tight">
          A Better Way to Give Feedback
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Our portal makes it simple for students to share their thoughts and for administrators to respond, creating a better learning environment for everyone.
        </p>
        <Button asChild size="lg">
          <Link to="/login">Get Started</Link>
        </Button>
      </div>

      <div className="mt-16 w-full max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;