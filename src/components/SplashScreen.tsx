import React from 'react';
import { Eye } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-white/20 rounded-full">
            <Eye size={64} className="text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">VisionBridge AI</h1>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="text-white/80 mt-4">Loading...</p>
      </div>
    </div>
  );
};

export default SplashScreen;