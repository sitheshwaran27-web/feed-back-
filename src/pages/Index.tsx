"use client";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full"> {/* Use h-full to fill Layout's main area */}
      <div className="text-center p-4">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Welcome to the Feedback Portal</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Please sign in to continue.
        </p>
        <Button asChild size="lg">
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;