import React from 'react';
import { Camera, Play } from 'lucide-react';

interface HomeScreenProps {
  onStartScanning: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartScanning }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="p-6 bg-blue-600/20 rounded-full mx-auto w-fit mb-6">
            <Camera size={64} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">VisionBridge AI</h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Point your phone and get audio navigation assistance
          </p>
        </div>

        <button
          onClick={onStartScanning}
          className="w-full p-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-xl flex items-center justify-center gap-3 shadow-lg"
          style={{ minHeight: '80px' }}
        >
          <Play size={28} />
          Start Scanning
        </button>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Tap the button above to begin real-time object detection and audio navigation
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;