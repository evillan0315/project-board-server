import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <header className="w-full max-w-4xl mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center">Resume AI Assistant</h1>
        <p className="mt-2 text-center text-gray-600">
          Optimize, Generate, and Enhance Your Resume with AI
        </p>
      </header>
      <main className="flex-grow w-full max-w-4xl bg-white shadow-xl rounded-lg p-6 sm:p-8">
        <Outlet />
      </main>
      <footer className="w-full max-w-4xl mt-8 text-center text-gray-500 text-sm">
        © 2024 Resume AI Assistant. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
