import React, { useState } from 'react';
import { Camera, Mic, AlertCircle } from 'lucide-react';

interface PermissionScreenProps {
  onPermissionGranted: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({ onPermissionGranted }) => {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    setLoading(true);
    setPermissionDenied(false);

    try {
      await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      onPermissionGranted();
    } catch (error) {
      setPermissionDenied(true);
      console.error('Permission denied:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center gap-4 mb-6">
            <div className="p-4 bg-blue-600/20 rounded-full">
              <Camera size={32} className="text-blue-400" />
            </div>
            <div className="p-4 bg-green-600/20 rounded-full">
              <Mic size={32} className="text-green-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Camera Access Required</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            VisionBridge AI needs access to your camera and microphone to provide real-time navigation assistance.
          </p>
        </div>

        {!permissionDenied ? (
          <button
            onClick={requestPermissions}
            disabled={loading}
            className="w-full p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {loading ? 'Requesting Access...' : 'Allow Camera & Microphone'}
          </button>
        ) : (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
            <AlertCircle className="mx-auto mb-4 text-red-400" size={32} />
            <h3 className="text-red-400 font-semibold mb-3">Permission Denied</h3>
            <p className="text-gray-300 mb-4 text-sm">
              To use VisionBridge AI, please:
            </p>
            <ol className="text-left text-sm text-gray-300 mb-4 space-y-2">
              <li>1. Refresh this page</li>
              <li>2. Click "Allow" when prompted</li>
              <li>3. Or check your browser settings</li>
            </ol>
            <button
              onClick={() => window.location.reload()}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionScreen;