import React from 'react';
import { ArrowLeft, Play, AlertTriangle, Clock } from 'lucide-react';
import { HistoryEntry, AppSettings } from '../types';
import { AudioService } from '../services/AudioService';

interface HistoryPanelProps {
  history: HistoryEntry[];
  settings: AppSettings;
  onBack: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, settings, onBack }) => {
  const playAudio = (entry: HistoryEntry) => {
    AudioService.speak(entry.description, settings);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group entries by date
  const groupedHistory = history.reduce((acc, entry) => {
    const dateKey = formatDate(entry.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Navigation History</h1>
      </div>

      {/* History Content */}
      <div className="p-4">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto mb-4 text-gray-500" size={48} />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No History Yet</h3>
            <p className="text-gray-500">
              Your navigation descriptions will appear here after you start scanning.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, entries]) => (
              <div key={date}>
                <h2 className="text-sm font-medium text-gray-400 mb-3 sticky top-0 bg-gray-900 py-2">
                  {date}
                </h2>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`bg-gray-800 rounded-lg p-4 ${
                        entry.isWarning ? 'border-l-4 border-red-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {entry.isWarning && (
                          <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white mb-2">{entry.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>{formatTime(entry.timestamp)}</span>
                            <span>Confidence: {Math.round(entry.confidence * 100)}%</span>
                          </div>
                        </div>
                        <button
                          onClick={() => playAudio(entry)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0"
                          aria-label="Play audio"
                        >
                          <Play size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;