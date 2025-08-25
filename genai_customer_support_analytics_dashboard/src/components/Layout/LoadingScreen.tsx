import React from 'react';
import { Bot, Brain } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <Bot className="text-blue-600 mx-auto animate-pulse" size={64} />
          <Brain className="text-indigo-600 absolute -top-2 -right-2 animate-bounce" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Support Coach AI</h2>
        <p className="text-gray-600 mb-6">Loading analytics dashboard...</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
