import React from 'react';
import { X, HelpCircle, Camera, Hand, Volume2, Smartphone } from 'lucide-react';
import { AppSettings } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, settings }) => {
  if (!isOpen) return null;

  const helpSections = [
    {
      icon: Camera,
      title: 'Getting Started',
      content: [
        'Tap "Start Scanning" to begin navigation',
        'Point your phone camera forward while walking',
        'Listen for audio descriptions of your surroundings',
        'Warnings will include beeps and vibration alerts'
      ]
    },
    {
      icon: Hand,
      title: 'Gestures & Controls',
      content: [
        'Tap screen during scanning for manual capture',
        'Use pause/resume button to control scanning',
        'Swipe gestures: Not required, use buttons instead',
        'Voice commands: Currently not supported'
      ]
    },
    {
      icon: Volume2,
      title: 'Audio Features',
      content: [
        'Adjust speech rate and volume in Settings',
        'Choose from multiple languages',
        'Warning sounds for obstacles and hazards',
        'Tap history entries to replay descriptions'
      ]
    },
    {
      icon: Smartphone,
      title: 'Troubleshooting',
      content: [
        'Ensure good lighting for better detection',
        'Hold phone steady for clearer analysis',
        'Check camera permissions in browser settings',
        'Restart app if audio stops working'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Help & Support</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Close help"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {helpSections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div key={index} className="bg-gray-700 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <IconComponent className="text-blue-400" size={24} />
                  <h3 className="text-lg font-medium text-white">{section.title}</h3>
                </div>
                <ul className="space-y-2 text-gray-300">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Contact Support */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-5">
            <h3 className="text-lg font-medium text-white mb-3">Need More Help?</h3>
            <p className="text-gray-300 mb-4">
              If you're experiencing issues or need additional support, please contact our accessibility team.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;