import { DetectionResult, DetectedObject, FrameDetection } from '../types';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export class VisionService {
  private static model: cocoSsd.ObjectDetection | null = null;
  private static frameHistory: FrameDetection[] = [];
  private static frameCounter = 0;
  private static confidenceThreshold = 0.7;
  private static readonly FRAME_HISTORY_SIZE = 3;

  // Reference object heights in real world (meters)
  private static readonly REFERENCE_HEIGHTS: Record<string, number> = {
    'person': 1.7,
    'car': 1.5,
    'truck': 2.5,
    'bus': 3.0,
    'bicycle': 1.1,
    'motorcycle': 1.2,
    'chair': 0.8,
    'dining table': 0.75,
    'bench': 0.45,
    'stop sign': 2.1,
    'traffic light': 3.5,
    'fire hydrant': 0.7,
    'dog': 0.6,
    'cat': 0.25,
    'bird': 0.15,
    'bottle': 0.25,
    'cup': 0.1,
    'bowl': 0.08,
    'banana': 0.18,
    'apple': 0.08,
    'orange': 0.07,
    'book': 0.25,
    'laptop': 0.02,
    'cell phone': 0.14,
    'backpack': 0.5,
    'handbag': 0.3,
    'suitcase': 0.6,
    'umbrella': 0.8,
    'potted plant': 0.4,
    'bed': 0.6,
    'couch': 0.8,
    'refrigerator': 1.7,
    'oven': 0.9,
    'microwave': 0.3,
    'toaster': 0.2,
    'sink': 0.2,
    'toilet': 0.4,
    'tv': 0.5,
    'remote': 0.15,
    'keyboard': 0.03,
    'mouse': 0.03,
    'scissors': 0.2,
    'teddy bear': 0.3,
    'hair drier': 0.25,
    'toothbrush': 0.2
  };

  static async initialize(): Promise<void> {
    if (!this.model) {
      try {
      this.model = await cocoSsd.load(); 
        this.model = await cocoSsd.load({
          base: 'mobilenet_v2' // Faster for mobile devices
        });
        console.log('COCO-SSD model loaded successfully');
      } catch (error) {
        console.error('Failed to load COCO-SSD model:', error);
        throw error;
      }
    }
  }

  static async analyzeImage(imageBlob: Blob): Promise<DetectionResult | null> {
    try {
      // Ensure model is loaded
      if (!this.model) {
        await this.initialize();
      }

      // Convert blob to image element
      const imageUrl = URL.createObjectURL(imageBlob);
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            URL.revokeObjectURL(imageUrl);
            
            // Detect lighting conditions
            const lightingCondition = await this.assessLightingCondition(img);
            
            // Adjust confidence threshold based on lighting
            this.adjustConfidenceThreshold(lightingCondition);
            
            // Run object detection
            const predictions = await this.model!.detect(img);
            
            // Filter by confidence and convert to our format
            const detectedObjects = this.processDetections(predictions, img.width, img.height);
            
            // Add to frame history
            const frameDetection: FrameDetection = {
              frameIndex: this.frameCounter++,
              timestamp: Date.now(),
              objects: detectedObjects,
              lightingCondition
            };
            
            this.addToFrameHistory(frameDetection);
            
            // Aggregate over last 3 frames
            const aggregatedObjects = this.aggregateDetections();
            
            // Generate description
            const result = this.generateDescription(aggregatedObjects, lightingCondition);
            
            resolve(result);
          } catch (error) {
            console.error('Detection failed:', error);
            resolve(this.getFallbackResult());
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          resolve(this.getFallbackResult());
        };
        
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Vision analysis failed:', error);
      return this.getFallbackResult();
    }
  }

  private static async assessLightingCondition(img: HTMLImageElement): Promise<'good' | 'low' | 'poor'> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return 'good';
    
    canvas.width = 100; // Sample size
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);
    
    const imageData = ctx.getImageData(0, 0, 100, 100);
    const data = imageData.data;
    
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }
    
    const avgBrightness = totalBrightness / (data.length / 4);
    
    if (avgBrightness < 50) return 'poor';
    if (avgBrightness < 100) return 'low';
    return 'good';
  }

  private static adjustConfidenceThreshold(lightingCondition: 'good' | 'low' | 'poor'): void {
    switch (lightingCondition) {
      case 'good':
        this.confidenceThreshold = 0.7;
        break;
      case 'low':
        this.confidenceThreshold = 0.6;
        break;
      case 'poor':
        this.confidenceThreshold = 0.5;
        break;
    }
  }

  private static processDetections(predictions: cocoSsd.DetectedObject[], imageWidth: number, imageHeight: number): DetectedObject[] {
    return predictions
      .filter(pred => pred.score >= this.confidenceThreshold)
      .map(pred => {
        const [x, y, width, height] = pred.bbox;
        
        // Calculate relative position
        const centerX = x + width / 2;
        const relativeX = centerX / imageWidth;
        
        let position: 'left' | 'center' | 'right';
        if (relativeX < 0.33) position = 'left';
        else if (relativeX > 0.67) position = 'right';
        else position = 'center';
        
        // Estimate distance based on bounding box height
        const distance = this.estimateDistance(pred.class, height, imageHeight);
        
        return {
          name: pred.class,
          confidence: pred.score,
          position,
          distance,
          bbox: { x, y, width, height },
          frameIndex: this.frameCounter
        };
      });
  }

  private static estimateDistance(objectClass: string, bboxHeight: number, imageHeight: number): number {
    const referenceHeight = this.REFERENCE_HEIGHTS[objectClass];
    
    if (!referenceHeight) {
      // Default estimation for unknown objects
      return Math.max(1, Math.round((imageHeight / bboxHeight) * 0.5));
    }
    
    // Camera field of view estimation (typical smartphone camera ~60 degrees vertical)
    const fovRadians = (60 * Math.PI) / 180;
    const assumedCameraHeight = 1.5; // meters (typical holding height)
    
    // Calculate distance using similar triangles
    const objectHeightRatio = bboxHeight / imageHeight;
    const realWorldHeight = referenceHeight;
    
    // Distance estimation formula
    const distance = (realWorldHeight * Math.tan(fovRadians / 2)) / (objectHeightRatio * Math.tan(fovRadians / 2));
    
    // Clamp distance to reasonable range (0.5m to 50m)
    return Math.max(0.5, Math.min(50, Math.round(distance * 10) / 10));
  }

  private static addToFrameHistory(frameDetection: FrameDetection): void {
    this.frameHistory.push(frameDetection);
    
    // Keep only last N frames
    if (this.frameHistory.length > this.FRAME_HISTORY_SIZE) {
      this.frameHistory.shift();
    }
  }

  private static aggregateDetections(): DetectedObject[] {
    if (this.frameHistory.length === 0) return [];
    
    // Group objects by class and position across frames
    const objectGroups: Map<string, DetectedObject[]> = new Map();
    
    this.frameHistory.forEach(frame => {
      frame.objects.forEach(obj => {
        const key = `${obj.name}-${obj.position}`;
        if (!objectGroups.has(key)) {
          objectGroups.set(key, []);
        }
        objectGroups.get(key)!.push(obj);
      });
    });
    
    // Filter out objects that don't appear in at least 2 of the last 3 frames
    const stableObjects: DetectedObject[] = [];
    
    objectGroups.forEach((objects, key) => {
      if (objects.length >= Math.max(1, Math.floor(this.frameHistory.length * 0.6))) {
        // Calculate average distance and confidence
        const avgDistance = objects.reduce((sum, obj) => sum + obj.distance, 0) / objects.length;
        const avgConfidence = objects.reduce((sum, obj) => sum + obj.confidence, 0) / objects.length;
        
        // Use the most recent detection as base
        const latestObj = objects[objects.length - 1];
        
        stableObjects.push({
          ...latestObj,
          distance: Math.round(avgDistance * 10) / 10,
          confidence: avgConfidence
        });
      }
    });
    
    // Sort by distance (closest first)
    return stableObjects.sort((a, b) => a.distance - b.distance);
  }

  private static generateDescription(objects: DetectedObject[], lightingCondition: 'good' | 'low' | 'poor'): DetectionResult {
    if (objects.length === 0) {
      return {
        description: lightingCondition === 'poor' 
          ? "Poor lighting detected. Path unclear, proceed with caution."
          : "Clear path ahead, no obstacles detected.",
        confidence: lightingCondition === 'good' ? 0.8 : 0.4,
        objects: [],
        isWarning: lightingCondition === 'poor'
      };
    }

    // Identify warning objects (close proximity or dangerous)
    const warningObjects = objects.filter(obj => 
      obj.distance <= 2.0 || 
      ['car', 'truck', 'bus', 'motorcycle', 'bicycle'].includes(obj.name) ||
      (obj.distance <= 3.0 && obj.position === 'center')
    );

    const isWarning = warningObjects.length > 0;
    
    let description = '';
    
    if (isWarning) {
      description = 'Warning: ';
    }

    if (objects.length === 1) {
      const obj = objects[0];
      const positionText = obj.position === 'center' ? 'ahead' : `on ${obj.position}`;
      description += `${obj.name} detected ${obj.distance} meters ${positionText}.`;
    } else {
      // Multiple objects - list by proximity
      description += `Multiple obstacles detected. `;
      
      objects.slice(0, 3).forEach((obj, index) => {
        const positionText = obj.position === 'center' ? 'ahead' : `on ${obj.position}`;
        
        if (index === 0) {
          description += `Closest: ${obj.name} ${obj.distance} meters ${positionText}`;
        } else {
          description += `, then ${obj.name} ${obj.distance} meters ${positionText}`;
        }
      });
      
      description += '.';
      
      if (objects.length > 3) {
        description += ` ${objects.length - 3} additional objects detected.`;
      }
    }

    // Add lighting condition warning if needed
    if (lightingCondition === 'low') {
      description += ' Low light conditions detected.';
    } else if (lightingCondition === 'poor') {
      description += ' Very poor lighting, exercise extreme caution.';
    }

    const avgConfidence = objects.reduce((sum, obj) => sum + obj.confidence, 0) / objects.length;

    return {
      description,
      confidence: avgConfidence,
      objects,
      isWarning
    };
  }

  private static getFallbackResult(): DetectionResult {
    return {
      description: "Unable to analyze image. Please ensure good lighting and stable camera position.",
      confidence: 0.1,
      objects: [],
      isWarning: true
    };
  }

  // Reset frame history (useful when starting new scanning session)
  static resetFrameHistory(): void {
    this.frameHistory = [];
    this.frameCounter = 0;
  }
}