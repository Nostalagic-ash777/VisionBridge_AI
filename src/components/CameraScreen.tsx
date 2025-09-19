import React, { useRef, useEffect, useState } from 'react';
import { Pause, Play, StopCircle, Loader } from 'lucide-react';
import { AppSettings, HistoryEntry, DetectionResult } from '../types';
import { AudioService } from '../services/AudioService';
import { VisionService } from '../services/VisionService';
import { VibrationService } from '../services/VibrationService';

interface CameraScreenProps {
  settings: AppSettings;
  onStop: () => void;
  onHistoryUpdate: (entry: HistoryEntry) => void;
  audioMuted: boolean;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ 
  settings, 
  onStop, 
  onHistoryUpdate, 
  audioMuted 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDescription, setLastDescription] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isScanning && settings.continuousMode) {
      interval = setInterval(captureAndAnalyze, 3000);
      // Initial capture
      setTimeout(captureAndAnalyze, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, settings.continuousMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      if (!audioMuted) {
        AudioService.speak('Failed to access camera. Please check permissions.', settings);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Capture frame
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      // Get image data
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        try {
          // Analyze image
          const result = await VisionService.analyzeImage(blob);
          
          if (result) {
            handleAnalysisResult(result);
          }
        } catch (error) {
          console.error('Analysis failed:', error);
        } finally {
          setIsProcessing(false);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Capture failed:', error);
      setIsProcessing(false);
    }
  };

  const handleAnalysisResult = (result: DetectionResult) => {
    setLastDescription(result.description);

    // Create history entry
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      description: result.description,
      confidence: result.confidence,
      isWarning: result.isWarning
    };

    onHistoryUpdate(historyEntry);

    // Play audio description
    if (!audioMuted) {
      if (result.isWarning) {
        // Play warning beep first
        AudioService.playBeep();
        setTimeout(() => {
          AudioService.speak(`Warning: ${result.description}`, settings);
        }, 500);
      } else {
        AudioService.speak(result.description, settings);
      }
    }

    // Vibrate for warnings
    if (result.isWarning && settings.vibrationEnabled) {
      VibrationService.vibrate([100, 50, 100]);
    }
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    const message = isScanning ? 'Scanning paused' : 'Scanning resumed';
    if (!audioMuted) {
      AudioService.speak(message, settings);
    }
  };

  const handleManualCapture = () => {
    if (!settings.continuousMode) {
      captureAndAnalyze();
    }
  };

  const handleStop = () => {
    const confirmStop = window.confirm('Are you sure you want to stop scanning?');
    if (confirmStop) {
      stopCamera();
      onStop();
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onClick={handleManualCapture}
      />

      {/* Hidden canvas for captures */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-blue-600/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <Loader className="animate-spin" size={16} />
          <span className="text-white text-sm">Analyzing...</span>
        </div>
      )}

      {/* Last Description */}
      {lastDescription && (
        <div className="absolute bottom-32 left-4 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-lg">
          <p className="text-white text-sm">{lastDescription}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6">
        <button
          onClick={toggleScanning}
          className={`p-4 rounded-full shadow-lg transition-colors ${
            isScanning 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          aria-label={isScanning ? 'Pause scanning' : 'Resume scanning'}
        >
          {isScanning ? <Pause size={24} /> : <Play size={24} />}
        </button>

        {!settings.continuousMode && (
          <button
            onClick={handleManualCapture}
            disabled={isProcessing}
            className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-full shadow-lg transition-colors"
            aria-label="Capture and analyze"
          >
            <Camera size={24} />
          </button>
        )}

        <button
          onClick={handleStop}
          className="p-4 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition-colors"
          aria-label="Stop scanning"
        >
          <StopCircle size={24} />
        </button>
      </div>

      {/* Scanning Status */}
      <div className="absolute top-6 left-6">
        <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
      </div>
    </div>
  );
};

export default CameraScreen;