import { DetectionResult, DetectedObject } from '../types';

export class VisionService {
  private static readonly API_ENDPOINT = 'https://api.example.com/vision'; // Replace with actual API
  private static readonly MOCK_MODE = true; // Set to false when using real API

  static async analyzeImage(imageBlob: Blob): Promise<DetectionResult | null> {
    if (this.MOCK_MODE) {
      return this.getMockAnalysis();
    }

    try {
      const formData = new FormData();
      formData.append('image', imageBlob);

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Vision API request failed');
      }

      const data = await response.json();
      return this.parseAPIResponse(data);
    } catch (error) {
      console.error('Vision analysis failed:', error);
      
      // Fallback to offline detection
      return this.getOfflineAnalysis();
    }
  }

  private static getMockAnalysis(): DetectionResult {
    const scenarios = [
      {
        description: "Clear path ahead, person walking 15 feet in front",
        confidence: 0.85,
        objects: [
          { name: "Person", confidence: 0.85, position: "center" as const, distance: "15 feet" }
        ],
        isWarning: false
      },
      {
        description: "Warning: Stairs descending ahead, handrail on right",
        confidence: 0.92,
        objects: [
          { name: "Stairs", confidence: 0.92, position: "center" as const, distance: "5 feet" }
        ],
        isWarning: true
      },
      {
        description: "Tree branch low on left, clear path on right",
        confidence: 0.78,
        objects: [
          { name: "Tree", confidence: 0.78, position: "left" as const, distance: "3 feet" }
        ],
        isWarning: true
      },
      {
        description: "Open sidewalk, building wall on right side",
        confidence: 0.88,
        objects: [
          { name: "Building", confidence: 0.88, position: "right" as const, distance: "8 feet" }
        ],
        isWarning: false
      },
      {
        description: "Warning: Car parked on right, moving vehicle ahead",
        confidence: 0.94,
        objects: [
          { name: "Car", confidence: 0.94, position: "right" as const, distance: "2 feet" },
          { name: "Vehicle", confidence: 0.89, position: "center" as const, distance: "20 feet" }
        ],
        isWarning: true
      }
    ];

    // Return random scenario
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  private static getOfflineAnalysis(): DetectionResult {
    return {
      description: "Offline mode: Basic object detection available",
      confidence: 0.5,
      objects: [
        { name: "Object", confidence: 0.5, position: "center" as const, distance: "unknown" }
      ],
      isWarning: false
    };
  }

  private static parseAPIResponse(data: any): DetectionResult {
    // Parse actual API response format
    return {
      description: data.description || "Unable to analyze image",
      confidence: data.confidence || 0,
      objects: data.objects?.map((obj: any) => ({
        name: obj.name,
        confidence: obj.confidence,
        position: obj.position,
        distance: obj.distance
      })) || [],
      isWarning: data.isWarning || false
    };
  }
}