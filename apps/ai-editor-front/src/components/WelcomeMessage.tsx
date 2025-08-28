import React from 'react';

const WelcomeMessage: React.FC = () => {
  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
      <div>
        <div className="text-xl font-medium text-black">Welcome to AI Editor!</div>
        <p className="text-gray-500">Start editing your code with AI assistance.</p>
      </div>
    </div>
  );
};

export default WelcomeMessage;
