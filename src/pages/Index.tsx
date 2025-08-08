"use client";

const Index = () => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center"> {/* Adjusted min-height */}
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