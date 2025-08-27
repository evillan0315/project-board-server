import React from 'react';
const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen text-sky-400">
      <div className="flex flex-col items-center space-y-4">
        <div
          className="w-12 h-12 border-4 border-t-4 border-sky-500 border-solid rounded-full animate-spin"
          aria-label="Loading"
        ></div>

        <p className="text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
