"use client";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center"> {/* Changed to min-h-screen */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Feedback Portal</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Please sign in to continue.
        </p>
      </div>
    </div>
  );
};

export default Index;