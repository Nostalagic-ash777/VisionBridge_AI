import React, { useState, useEffect } from 'react';
import { Camera, Settings, HelpCircle, History, Volume2, VolumeX } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import PermissionScreen from './components/PermissionScreen';
import HomeScreen from './components/HomeScreen';
import CameraScreen from './components/CameraScreen';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import HelpModal from './components/HelpModal';
import { AudioService } from './services/AudioService';
import { StorageService } from './services/StorageService';
import { AppSettings, HistoryEntry } from './types';

type Screen = 'splash' | 'permissions' | 'home' | 'camera' | 'settings' | 'history';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [hasPermissions, setHasPermissions] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    speechRate: 1,
    volume: 0.8,
    language: 'en-US',
    continuousMode: true,
    vibrationEnabled: true
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Load saved settings and history
        const savedSettings = await StorageService.getSettings();
        const savedHistory = await StorageService.getHistory();
        
        if (savedSettings) setSettings(savedSettings);
        if (savedHistory) setHistory(savedHistory);

        // Check existing permissions
        const permissions = await checkPermissions();
        setHasPermissions(permissions);

        // Show splash for 2 seconds
        setTimeout(() => {
          setCurrentScreen(permissions ? 'home' : 'permissions');
        }, 2000);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setTimeout(() => {
          setCurrentScreen('permissions');
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  const checkPermissions = async (): Promise<boolean> => {
    try {
      const cameraPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraPermission.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  };

  const handlePermissionGranted = () => {
    setHasPermissions(true);
    setCurrentScreen('home');
    AudioService.speak('Permissions granted. Welcome to VisionBridge AI.', settings);
  };

  const handleStartScanning = () => {
    setCurrentScreen('camera');
    setIsScanning(true);
    AudioService.speak('Starting camera scan. Point your device to begin navigation.', settings);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setCurrentScreen('home');
    AudioService.speak('Scanning stopped.', settings);
  };

  const handleSettingsUpdate = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  const handleHistoryUpdate = async (entry: HistoryEntry) => {
    const newHistory = [entry, ...history].slice(0, 50); // Keep last 50 entries
    setHistory(newHistory);
    await StorageService.saveHistory(newHistory);
  };

  const toggleAudio = () => {
    setAudioMuted(!audioMuted);
    AudioService.speak(audioMuted ? 'Audio enabled' : 'Audio disabled', settings);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'permissions':
        return <PermissionScreen onPermissionGranted={handlePermissionGranted} />;
      case 'home':
        return <HomeScreen onStartScanning={handleStartScanning} />;
      case 'camera':
        return (
          <CameraScreen
            settings={settings}
            onStop={handleStopScanning}
            onHistoryUpdate={handleHistoryUpdate}
            audioMuted={audioMuted}
          />
        );
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            onUpdate={handleSettingsUpdate}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'history':
        return (
          <HistoryPanel
            history={history}
            settings={settings}
            onBack={() => setCurrentScreen('home')}
          />
        );
      default:
        return <HomeScreen onStartScanning={handleStartScanning} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {renderCurrentScreen()}

      {/* Navigation Controls */}
      {currentScreen === 'home' && (
        <div className="fixed top-4 right-4 flex gap-2">
          <button
            onClick={() => setCurrentScreen('settings')}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setCurrentScreen('history')}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors"
            aria-label="History"
          >
            <History size={20} />
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      )}

      {/* Audio Control for Camera Screen */}
      {currentScreen === 'camera' && (
        <button
          onClick={toggleAudio}
          className="fixed top-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors z-20"
          aria-label={audioMuted ? 'Enable audio' : 'Disable audio'}
        >
          {audioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        settings={settings}
      />
    </div>
  );
}

export default App;