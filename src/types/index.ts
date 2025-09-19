export interface AppSettings {
  speechRate: number;
  volume: number;
  language: string;
  continuousMode: boolean;
  vibrationEnabled: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  confidence: number;
  isWarning: boolean;
}

export interface DetectionResult {
  description: string;
  confidence: number;
  objects: DetectedObject[];
  isWarning: boolean;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  position: 'left' | 'center' | 'right';
  distance: number; // in meters
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  frameIndex: number;
}

export interface FrameDetection {
  frameIndex: number;
  timestamp: number;
  objects: DetectedObject[];
  lightingCondition: 'good' | 'low' | 'poor';
}